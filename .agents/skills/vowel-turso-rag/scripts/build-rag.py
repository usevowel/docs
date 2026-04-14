#!/usr/bin/env python3
"""
RAG Prebuild Script for VowelDocs - llama.cpp Vulkan Edition

Pre-processes all MDX documentation files, chunks them, and generates embeddings
using llama.cpp with Vulkan GPU acceleration via GGUF models.

Creates a ready-to-load artifact for the Haven VectorDB client.

Usage:
    uv run python scripts/build-rag.py

Requirements:
    - llama-server binary (downloaded automatically on first run)
    - GGUF embedding model (downloaded automatically on first run)
    - Vulkan-compatible GPU (falls back to CPU if not available)
"""

import os
import yaml
import hashlib
import re
import time
import subprocess
import requests
from pathlib import Path
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict
from tqdm import tqdm
import numpy as np

LOG_PREFIX = "[rag]"


def log(message: str) -> None:
    print(f"{LOG_PREFIX}: {message}")


# =============================================================================
# CONFIGURATION
# =============================================================================


@dataclass
class Config:
    """Build configuration matching the client-side RAG settings."""

    # Model settings (must match Haven/Transformers.js config)
    model_repo: str = "second-state/All-MiniLM-L6-v2-Embedding-GGUF"
    model_file: str = "all-MiniLM-L6-v2-Q4_K_M.gguf"
    dimensions: int = 384  # Output embedding dimensions
    context_length: int = 512  # Model's max token context

    # Chunking settings - keep under context_length to avoid truncation
    # ~4 chars per token average, so 400 chars ~ 100 tokens safe margin
    chunk_size: int = 400  # Characters per chunk (fits in 512 tokens)
    chunk_overlap: int = 50  # Character overlap

    # llama-server settings (auto-detect latest version if not specified)
    llama_version: str = "8698"  # Pinned to available version (b8698)
    server_host: str = "127.0.0.1"
    server_port: int = 8081
    n_gpu_layers: int = 99  # Offload all layers to GPU
    n_parallel: int = 64  # Number of parallel slots for concurrent requests

    # Paths
    base_dir: Path = Path(__file__).parent
    docs_dir: Path = None  # Set in __post_init__
    output_path: Path = None  # Set in __post_init__
    llama_dir: Path = None  # Set in __post_init__
    model_path: Path = None  # Set in __post_init__
    state_path: Path = None  # Set in __post_init__ - for incremental builds

    def resolve_version(self) -> None:
        """Resolve 'latest' to actual version number."""
        if self.llama_version == "latest":
            self.llama_version = get_latest_llama_version()

    def __post_init__(self):
        # Resolve version first (needed for paths)
        self.resolve_version()

        if self.docs_dir is None:
            # VitePress docs are in the root directory
            self.docs_dir = self.base_dir.parent
        if self.output_path is None:
            self.output_path = self.base_dir.parent / "public/rag-index.yml"
        if self.llama_dir is None:
            self.llama_dir = self.base_dir / f"llama-b{self.llama_version}"
        if self.model_path is None:
            self.model_path = self.base_dir / self.model_file
        if self.state_path is None:
            self.state_path = self.base_dir / ".rag-build-state.yml"

    @property
    def server_url(self) -> str:
        return f"http://{self.server_host}:{self.server_port}"


# Global config - will be instantiated at runtime
CONFIG: Optional[Config] = None


def get_config() -> Config:
    """Get or create global config instance."""
    global CONFIG
    if CONFIG is None:
        CONFIG = Config()
    return CONFIG


# =============================================================================
# DATA STRUCTURES
# =============================================================================


@dataclass
class DocumentChunk:
    """A single chunk of a document with metadata."""

    id: str
    text: str
    embedding: List[float]
    metadata: Dict[str, Any]


@dataclass
class RawDocument:
    """Raw document loaded from MDX file."""

    path: str  # Relative path from docs dir
    source_path: str  # Relative source file path, including extension
    title: str
    description: Optional[str]
    content: str  # Cleaned content without frontmatter
    category: str
    url_path: str


# =============================================================================
# INCREMENTAL BUILD STATE
# =============================================================================


@dataclass
class ChunkState:
    """State for a single chunk to track if it needs reprocessing."""

    chunk_id: str
    content_hash: str  # Hash of the chunk text
    text: str  # Cached chunk text for rebuilding output without reparsing the index
    embedding: List[float]  # Cached embedding
    metadata: Dict[str, Any]  # Cached metadata


@dataclass
class FileState:
    """State for a single file to track if it needs reprocessing."""

    file_path: str
    content_hash: str  # Hash of the raw file content
    mtime: float  # Last modified time
    chunks: Dict[str, ChunkState]  # chunk_id -> ChunkState


@dataclass
class BuildState:
    """Complete build state for incremental processing."""

    version: str  # Build state format version
    created_at: str  # ISO timestamp
    model: str  # Model used for embeddings
    model_file: str  # Model file used
    files: Dict[str, FileState]  # file_path -> FileState
    manifest_hash: Optional[str] = None
    generated_at: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "version": self.version,
            "created_at": self.created_at,
            "model": self.model,
            "model_file": self.model_file,
            "manifest_hash": self.manifest_hash,
            "generated_at": self.generated_at,
            "files": {
                path: {
                    "file_path": fs.file_path,
                    "content_hash": fs.content_hash,
                    "mtime": fs.mtime,
                    "chunks": {
                        cid: {
                            "chunk_id": cs.chunk_id,
                            "content_hash": cs.content_hash,
                            "text": cs.text,
                            "embedding": cs.embedding,
                            "metadata": cs.metadata,
                        }
                        for cid, cs in fs.chunks.items()
                    },
                }
                for path, fs in self.files.items()
            },
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "BuildState":
        """Create BuildState from dictionary."""
        files = {}
        for path, fs_data in data.get("files", {}).items():
            chunks = {}
            for cid, cs_data in fs_data.get("chunks", {}).items():
                chunks[cid] = ChunkState(
                    chunk_id=cs_data["chunk_id"],
                    content_hash=cs_data["content_hash"],
                    text=cs_data.get("text", ""),
                    embedding=cs_data["embedding"],
                    metadata=cs_data["metadata"],
                )
            files[path] = FileState(
                file_path=fs_data["file_path"],
                content_hash=fs_data["content_hash"],
                mtime=fs_data["mtime"],
                chunks=chunks,
            )
        return cls(
            version=data.get("version", "1.0.0"),
            created_at=data.get("created_at", ""),
            model=data.get("model", ""),
            model_file=data.get("model_file", ""),
            files=files,
            manifest_hash=data.get("manifest_hash"),
            generated_at=data.get("generated_at"),
        )


def compute_hash(content: str) -> str:
    """Compute MD5 hash of content for change detection."""
    return hashlib.md5(content.encode("utf-8")).hexdigest()


def load_build_state(state_path: Path) -> Optional[BuildState]:
    """Load previous build state if it exists."""
    if not state_path.exists():
        return None
    try:
        with open(state_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
        return BuildState.from_dict(data)
    except Exception as e:
        log(f"Failed to load build state: {e}")
        return None


def save_build_state(state: BuildState, state_path: Path) -> None:
    """Save build state to disk."""
    try:
        with open(state_path, "w", encoding="utf-8") as f:
            yaml.dump(
                state.to_dict(),
                f,
                default_flow_style=False,
                allow_unicode=True,
                sort_keys=False,
            )
    except Exception as e:
        log(f"Failed to save build state: {e}")


def is_file_changed(file_path: Path, file_state: Optional[FileState]) -> bool:
    """Check if a file has changed since last build."""
    if file_state is None:
        return True

    if not file_path.exists():
        return True

    # Check mtime first (fast path)
    current_mtime = file_path.stat().st_mtime
    if current_mtime != file_state.mtime:
        return True

    # Check content hash
    try:
        current_content = file_path.read_text(encoding="utf-8")
        current_hash = compute_hash(current_content)
        return current_hash != file_state.content_hash
    except Exception:
        return True


def is_chunk_changed(
    chunk_id: str, chunk_text: str, file_state: Optional[FileState]
) -> tuple[bool, Optional[List[float]]]:
    """
    Check if a chunk has changed and return cached embedding if available.

    Returns:
        (has_changed, cached_embedding)
    """
    if file_state is None:
        return True, None

    chunk_state = file_state.chunks.get(chunk_id)
    if chunk_state is None:
        return True, None

    current_hash = compute_hash(chunk_text)
    if current_hash != chunk_state.content_hash:
        return True, None

    if not chunk_state.embedding:
        return True, None

    # Chunk unchanged, return cached embedding
    return False, chunk_state.embedding


# =============================================================================
# LLAMA.CPP VERSION DETECTION
# =============================================================================


def get_latest_llama_version() -> str:
    """Fetch the latest llama.cpp release version from GitHub."""
    try:
        log("Checking for latest llama.cpp version...")
        response = requests.get(
            "https://api.github.com/repos/ggml-org/llama.cpp/releases/latest",
            timeout=10,
        )
        response.raise_for_status()
        data = response.json()
        tag_name = data.get("tag_name", "")
        # Remove 'b' prefix if present (e.g., "b9876" -> "9876")
        version = tag_name.lstrip("b")
        log(f"Latest llama.cpp version: {tag_name} (build {version})")
        return version
    except Exception as e:
        log(f"Failed to fetch latest llama.cpp version: {e}")
        log("Falling back to pinned version: b8671")
        return "8671"


# =============================================================================
# LLAMA.CPP SERVER MANAGEMENT
# =============================================================================


class LlamaServerManager:
    """Manages llama-server lifecycle for embedding generation."""

    def __init__(self, config: Optional[Config] = None):
        self.config = config or get_config()
        self.process: Optional[subprocess.Popen] = None
        self.server_binary = self.config.llama_dir / "llama-server"

    def is_binary_available(self) -> bool:
        """Check if llama-server binary exists."""
        return self.server_binary.exists()

    def download_binary(self) -> None:
        """Download llama-server binary with Vulkan support."""
        version_tag = f"b{self.config.llama_version}"
        log(f"Downloading llama-server ({version_tag})...")

        url = f"https://github.com/ggml-org/llama.cpp/releases/download/{version_tag}/llama-{version_tag}-bin-ubuntu-vulkan-x64.tar.gz"
        archive_path = self.config.base_dir / "llama-vulkan.tar.gz"

        # Download
        result = subprocess.run(
            ["curl", "-L", "-o", str(archive_path), url], capture_output=True, text=True
        )
        if result.returncode != 0:
            raise RuntimeError(f"Failed to download llama-server: {result.stderr}")

        # Extract
        result = subprocess.run(
            ["tar", "-xzf", str(archive_path), "-C", str(self.config.base_dir)],
            capture_output=True,
        )
        if result.returncode != 0:
            raise RuntimeError("Failed to extract llama-server archive")

        # Clean up
        archive_path.unlink(missing_ok=True)

        if not self.server_binary.exists():
            raise RuntimeError("llama-server binary not found after extraction")

        log(f"llama-server ready at {self.server_binary}")

    def is_model_available(self) -> bool:
        """Check if GGUF model exists."""
        return self.config.model_path.exists()

    def download_model(self) -> None:
        """Download GGUF embedding model from HuggingFace."""
        log(f"Downloading embedding model ({self.config.model_file})...")

        url = f"https://huggingface.co/{self.config.model_repo}/resolve/main/{self.config.model_file}"

        result = subprocess.run(
            ["curl", "-L", "-o", str(self.config.model_path), url],
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            raise RuntimeError(f"Failed to download model: {result.stderr}")

        if not self.config.model_path.exists():
            raise RuntimeError("Model file not found after download")

        log(f"Model ready at {self.config.model_path}")

    def start(self) -> None:
        """Start llama-server with embedding support."""
        if self.process is not None:
            return

        # Ensure dependencies
        if not self.is_binary_available():
            self.download_binary()
        if not self.is_model_available():
            self.download_model()

        log(f"Starting llama-server on {self.config.server_host}:{self.config.server_port}...")

        # Start server with Vulkan GPU acceleration
        # Using -np (parallel slots) for concurrent embedding requests
        cmd = [
            str(self.server_binary),
            "-m",
            str(self.config.model_path),
            "--embeddings",
            "-ngl",
            str(self.config.n_gpu_layers),
            "-c",
            str(self.config.context_length),
            "-np",
            str(self.config.n_parallel),  # Parallel slots
            "--host",
            self.config.server_host,
            "--port",
            str(self.config.server_port),
        ]

        self.process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
        )

        # Wait for server to be ready
        self._wait_for_ready()
        log("llama-server ready (Vulkan GPU acceleration active)")

    def _wait_for_ready(self, timeout: int = 60) -> None:
        """Wait for server to be ready to accept requests."""
        start = time.time()
        while time.time() - start < timeout:
            try:
                response = requests.get(f"{self.config.server_url}/health", timeout=1)
                if response.status_code == 200:
                    return
            except requests.exceptions.ConnectionError:
                pass

            # Check if process crashed
            if self.process.poll() is not None:
                stdout, _ = self.process.communicate()
                raise RuntimeError(f"Server crashed:\n{stdout}")

            time.sleep(0.5)

        raise RuntimeError("Server failed to start within timeout")

    def stop(self) -> None:
        """Stop the llama-server process."""
        if self.process is not None:
            self.process.terminate()
            try:
                self.process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.process.kill()
                self.process.wait()
            self.process = None
            log("llama-server stopped")

    def __enter__(self):
        self.start()
        return self

    def __exit__(self, *args):
        self.stop()


# =============================================================================
# EMBEDDING GENERATOR
# =============================================================================

from concurrent.futures import ThreadPoolExecutor, as_completed
import threading


class LlamaEmbeddingGenerator:
    """Generate embeddings using llama-server HTTP API with parallel slots."""

    def __init__(self, server_url: Optional[str] = None, n_slots: int = 64):
        config = get_config()
        self.server_url = server_url or config.server_url
        self.n_slots = n_slots
        self.session = requests.Session()  # Reuse connections
        self._lock = threading.Lock()
        self._progress = None

    def _embed_single(self, chunk_data: Dict[str, Any]) -> DocumentChunk:
        """Generate embedding for a single chunk (thread-safe)."""
        text = chunk_data["text"]

        # Truncate if too long (rough estimate: 4 chars per token)
        max_chars = 450  # Keep under 512 token limit
        if len(text) > max_chars:
            text = text[:max_chars]

        response = self.session.post(
            f"{self.server_url}/embedding",
            headers={"Content-Type": "application/json"},
            json={"content": text},
            timeout=30,
        )
        response.raise_for_status()

        data = response.json()
        # Response format: [{"index": 0, "embedding": [[...]]}]
        embedding = data[0]["embedding"][0]

        # Update progress
        with self._lock:
            if self._progress:
                self._progress.update(1)

        return DocumentChunk(
            id=chunk_data["id"],
            text=chunk_data["text"],
            embedding=embedding,
            metadata=chunk_data["metadata"],
        )

    def embed_chunks(self, chunks: List[Dict[str, Any]]) -> List[DocumentChunk]:
        """Generate embeddings using parallel requests across all slots."""
        results = [None] * len(chunks)

        with tqdm(total=len(chunks), desc="Generating embeddings") as self._progress:
            with ThreadPoolExecutor(max_workers=self.n_slots) as executor:
                # Submit all tasks
                future_to_idx = {
                    executor.submit(self._embed_single, chunk): i
                    for i, chunk in enumerate(chunks)
                }

                # Collect results as they complete
                for future in as_completed(future_to_idx):
                    idx = future_to_idx[future]
                    try:
                        results[idx] = future.result()
                    except Exception as e:
                        log(f"Error embedding chunk {idx}: {e}")
                        raise

        return results


# =============================================================================
# TEXT PROCESSING
# =============================================================================


def extract_frontmatter_field(source: str, field: str) -> Optional[str]:
    """Extract a field value from YAML frontmatter."""
    pattern = rf"^{field}:\s*(.+)$"
    match = re.search(pattern, source, re.MULTILINE)
    if not match:
        return None
    value = match.group(1).strip()
    # Remove quotes if present
    value = re.sub(r"^['\"]|['\"]$", "", value)
    return value


def remove_frontmatter(source: str) -> str:
    """Remove YAML frontmatter from MDX content."""
    pattern = r"^---\s*\n[\s\S]*?\n---\s*\n"
    return re.sub(pattern, "", source)


def clean_mdx_content(content: str) -> str:
    """
    Clean MDX content by removing JSX components, code blocks, and other
    non-textual elements while preserving readable text.
    """
    # Remove import statements
    content = re.sub(
        r"^import\s+.*?from\s+['\"].*?['\"];?\s*$", "", content, flags=re.MULTILINE
    )

    # Remove export statements
    content = re.sub(r"^export\s+.*?;?\s*$", "", content, flags=re.MULTILINE)

    # Remove JSX component tags but keep their text content
    # Pattern: <Tag>content</Tag> -> content
    content = re.sub(r"<\w+[^>]*>([\s\S]*?)<\/\w+>", r"\1", content)

    # Remove self-closing tags
    content = re.sub(r"<\w+[^/]*\/>", "", content)

    # Remove code blocks (replace with placeholder)
    content = re.sub(r"```[\s\S]*?```", "[code example]", content)

    # Remove inline code backticks
    content = re.sub(r"`([^`]+)`", r"\1", content)

    # Remove HTML/MDX comments
    content = re.sub(r"<!--[\s\S]*?-->", "", content)

    # Remove JSX expressions {variable}
    content = re.sub(r"\{[^{}]*\}", "", content)

    # Normalize whitespace (3+ newlines -> 2)
    content = re.sub(r"\n{3,}", "\n\n", content)

    return content.strip()


def to_title_case(value: str) -> str:
    """Convert kebab-case or snake_case to Title Case."""
    parts = value.replace("_", "-").split("-")
    return " ".join(part.capitalize() for part in parts if part)


def generate_chunk_id(doc_path: str, chunk_index: int) -> str:
    """Generate a unique ID for a chunk based on doc path and index."""
    hash_input = f"{doc_path}-{chunk_index}"
    return hashlib.md5(hash_input.encode()).hexdigest()[:12]


# =============================================================================
# CHUNKING
# =============================================================================


def chunk_document(
    text: str, chunk_size: Optional[int] = None, overlap: Optional[int] = None
) -> List[str]:
    """
    Split text into overlapping chunks using sentence-aware boundaries.

    This matches the client-side chunking logic in prebuilt-rag.ts.
    """
    config = get_config()
    chunk_size = chunk_size or config.chunk_size
    overlap = overlap or config.chunk_overlap
    chunks = []

    # Split into sentences (basic sentence detection)
    sentences = re.findall(r"[^.!?]+[.!?]+\s*", text)

    if not sentences:
        # If no sentences found, treat entire text as one chunk
        if len(text) > 50:
            return [text]
        return []

    current_chunk = ""
    current_size = 0

    for sentence in sentences:
        sentence_length = len(sentence)

        # If adding this sentence would exceed chunk size, save current and start new
        if current_size + sentence_length > chunk_size and current_chunk:
            chunks.append(current_chunk.strip())

            # Start new chunk with overlap
            overlap_text = (
                current_chunk[-overlap:]
                if len(current_chunk) > overlap
                else current_chunk
            )
            current_chunk = overlap_text + sentence
            current_size = len(overlap_text) + sentence_length
        else:
            current_chunk += sentence
            current_size += sentence_length

    # Don't forget the last chunk
    if current_chunk.strip() and len(current_chunk.strip()) > 50:
        chunks.append(current_chunk.strip())

    return chunks


# =============================================================================
# DOCUMENT LOADING
# =============================================================================


def load_document(file_path: Path, docs_dir: Path) -> Optional[RawDocument]:
    """Load and process a single MDX document."""
    try:
        raw_content = file_path.read_text(encoding="utf-8")

        # Calculate relative path from docs directory
        relative_path = file_path.relative_to(docs_dir).with_suffix("")
        source_relative_path = file_path.relative_to(docs_dir)
        path_str = str(relative_path).replace("\\", "/")
        source_path_str = str(source_relative_path).replace("\\", "/")

        # Parse path components
        path_segments = path_str.split("/")
        slug_segments = list(path_segments)

        # Handle index files
        if slug_segments and slug_segments[-1] == "index":
            slug_segments.pop()

        # Build URL path (VitePress format)
        if not slug_segments:
            url_path = "/"
        else:
            url_path = f"/{'/'.join(slug_segments)}/"

        # Determine category based on first folder
        if len(slug_segments) <= 1:
            category = "Getting Started"
        else:
            category = to_title_case(slug_segments[0])

        # Extract title from frontmatter or filename
        title = extract_frontmatter_field(raw_content, "title")
        if not title:
            last_segment = slug_segments[-1] if slug_segments else "index"
            if last_segment == "index" and len(slug_segments) > 1:
                last_segment = slug_segments[-2]
            title = to_title_case(last_segment)

        # Extract description
        description = extract_frontmatter_field(raw_content, "description")

        # Clean content
        clean_content = clean_mdx_content(remove_frontmatter(raw_content))

        return RawDocument(
            path=path_str,
            source_path=source_path_str,
            title=title,
            description=description,
            content=clean_content,
            category=category,
            url_path=url_path,
        )
    except Exception as e:
        log(f"Error loading {file_path}: {e}")
        return None


def load_all_documents(docs_dir: Path) -> List[RawDocument]:
    """Load all MDX files from the documentation directory."""
    log(f"Loading documents from {docs_dir}...")

    # Directories to exclude from indexing
    EXCLUDE_DIRS = {
        ".agents",
        "agents",
        "node_modules",
        ".vitepress",
        ".vite",
        ".git",
        "api/reference",  # Generated API docs
        "scripts",  # Build scripts
        "public",  # Static assets
        "dist",
        ".output",
        "build",
    }

    # Individual files to exclude (internal docs not for public site)
    # Per AGENTS.md: These are excluded from the published site
    EXCLUDE_FILES = {
        "AGENTS.md",  # Internal agent instructions
        "README.md",  # Internal repo readme
        "cloudflare-pages.md",  # Internal deployment guide
        "voweldocs-README.md",  # Internal voweldocs readme
        ".ai/specs/voweldoc.md",  # Internal specs
        ".ai/specs/voweldoc-README.md",  # Internal specs
        "guide/TRANSCRIPTS.md",  # Internal transcripts
        "guide/v2-api-migration.md",  # Legacy migration guide (excluded from publish)
    }

    documents = []
    # VitePress uses .md files, not .mdx
    md_files = list(docs_dir.rglob("*.md"))

    for file_path in tqdm(md_files, desc="Loading documents"):
        # Skip files in excluded directories
        relative_parts = file_path.relative_to(docs_dir).parts
        if any(part in EXCLUDE_DIRS for part in relative_parts):
            continue

        # Skip individual excluded files
        relative_path = file_path.relative_to(docs_dir).as_posix()
        if file_path.name in EXCLUDE_FILES or relative_path in EXCLUDE_FILES:
            continue

        doc = load_document(file_path, docs_dir)
        if doc:
            documents.append(doc)

    log(f"Loaded {len(documents)} documents ({len(md_files)} files scanned)")
    return documents


# =============================================================================
# BUILD PIPELINE
# =============================================================================


def process_documents_incremental(
    documents: List[RawDocument],
    previous_state: Optional[BuildState],
    config: Optional[Config] = None,
) -> tuple[List[Dict[str, Any]], BuildState, int, int]:
    """
    Process documents into chunks with incremental change detection.

    Returns:
        (chunks_to_embed, new_state, skipped_chunks, total_chunks)
    """
    config = config or get_config()
    log("Chunking documents (incremental)...")

    new_state = BuildState(
        version="1.0.0",
        created_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        model=config.model_repo,
        model_file=config.model_file,
        files={},
    )

    chunks_to_embed: List[Dict[str, Any]] = []
    total_chunks = 0
    skipped_chunks = 0

    for doc in tqdm(documents, desc="Chunking"):
        # Skip empty documents
        if not doc.content or len(doc.content) < 50:
            continue

        # Get previous file state if available
        prev_file_state = previous_state.files.get(doc.path) if previous_state else None

        # Check if entire file needs reprocessing
        full_file_path = config.docs_dir / Path(doc.source_path)
        file_changed = is_file_changed(full_file_path, prev_file_state)

        # Generate chunks
        chunks = chunk_document(doc.content, config.chunk_size, config.chunk_overlap)

        # Track file state
        file_chunks: Dict[str, ChunkState] = {}

        for idx, chunk_text in enumerate(chunks):
            total_chunks += 1

            # Add context to each chunk (document title + description)
            context_prefix = f"[{doc.title}]"
            if doc.description:
                context_prefix += f"\n{doc.description}"

            contextualized_text = f"{context_prefix}\n\n{chunk_text}"

            chunk_id = generate_chunk_id(doc.path, idx)
            full_chunk_id = f"{doc.path}-{chunk_id}"

            # Check if this specific chunk changed
            if not file_changed:
                # File unchanged, check individual chunk
                has_changed, cached_embedding = is_chunk_changed(
                    chunk_id, contextualized_text, prev_file_state
                )

                if not has_changed and cached_embedding:
                    # Chunk unchanged, reuse embedding
                    skipped_chunks += 1
                    file_chunks[chunk_id] = ChunkState(
                        chunk_id=chunk_id,
                        content_hash=compute_hash(contextualized_text),
                        text=contextualized_text,
                        embedding=cached_embedding,
                        metadata={
                            "title": doc.title,
                            "path": doc.path,
                            "urlPath": doc.url_path,
                            "category": doc.category,
                            "chunkIndex": idx,
                            "totalChunks": len(chunks),
                            "position": idx / len(chunks) if chunks else 0,
                        },
                    )
                    continue

            # Chunk needs embedding
            chunks_to_embed.append(
                {
                    "id": full_chunk_id,
                    "text": contextualized_text,
                    "metadata": {
                        "title": doc.title,
                        "path": doc.path,
                        "urlPath": doc.url_path,
                        "category": doc.category,
                        "chunkIndex": idx,
                        "totalChunks": len(chunks),
                        "position": idx / len(chunks) if chunks else 0,
                    },
                }
            )

            # Placeholder state - will be updated after embedding
            file_chunks[chunk_id] = ChunkState(
                chunk_id=chunk_id,
                content_hash=compute_hash(contextualized_text),
                text=contextualized_text,
                embedding=[],  # Will be filled after embedding
                metadata={},
            )

        # Update file state
        try:
            raw_content = full_file_path.read_text(encoding="utf-8")
            content_hash = compute_hash(raw_content)
            mtime = full_file_path.stat().st_mtime
        except Exception:
            content_hash = ""
            mtime = 0

        new_state.files[doc.path] = FileState(
            file_path=doc.source_path,
            content_hash=content_hash,
            mtime=mtime,
            chunks=file_chunks,
        )

    log(f"Created {total_chunks} chunks ({skipped_chunks} skipped, {len(chunks_to_embed)} new/modified)")
    return chunks_to_embed, new_state, skipped_chunks, total_chunks


def finalize_state_with_embeddings(
    state: BuildState,
    embedded_chunks: List[DocumentChunk],
) -> BuildState:
    """Update state with embeddings after generation."""
    # Create lookup map
    embeddings_by_id = {chunk.id: chunk for chunk in embedded_chunks}

    for file_path, file_state in state.files.items():
        for chunk_id, chunk_state in file_state.chunks.items():
            full_chunk_id = f"{file_path}-{chunk_id}"
            if full_chunk_id in embeddings_by_id:
                embedded = embeddings_by_id[full_chunk_id]
                chunk_state.embedding = embedded.embedding
                chunk_state.metadata = embedded.metadata

    return state


def save_index(
    chunks: List[DocumentChunk],
    output_path: Path,
    config: Optional[Config] = None,
    manifest_hash: Optional[str] = None,
    generated_at: Optional[str] = None,
) -> None:
    """Save the prebuilt index to YAML."""
    config = config or get_config()
    log(f"Saving index to {output_path}...")

    # Ensure output directory exists
    output_path.parent.mkdir(parents=True, exist_ok=True)

    chunk_entries = []
    content_hashes = []
    for chunk in chunks:
        content_hash = compute_hash(chunk.text)
        content_hashes.append(content_hash)
        chunk_entries.append(
            {
                "id": chunk.id,
                "text": chunk.text,
                "content_hash": content_hash,
                "vector": chunk.embedding.tolist()
                if hasattr(chunk.embedding, "tolist")
                else list(chunk.embedding),
                "metadata": chunk.metadata,
            }
        )

    if manifest_hash is None:
        manifest_hash = compute_hash("".join(sorted(content_hashes))) if content_hashes else compute_hash("empty")

    if generated_at is None:
        generated_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    if output_path.exists():
        try:
            with open(output_path, "r", encoding="utf-8") as f:
                existing_data = yaml.safe_load(f)
            if isinstance(existing_data, dict) and existing_data.get("manifest_hash") == manifest_hash:
                log(f"Index content unchanged (manifest_hash={manifest_hash[:12]}), skipping rewrite")
                return
        except Exception as e:
            log(f"Could not inspect existing index before rewrite: {e}")

    index_data = {
        "version": "2.0.0",
        "model": config.model_repo,
        "model_file": config.model_file,
        "dimensions": config.dimensions,
        "metric": "cosine",
        "vector_format": "float32-array",
        "runtime_target": "turso-browser-wasm",
        "manifest_hash": manifest_hash,
        "generated_at": generated_at,
        "chunk_count": len(chunks),
        "chunks": chunk_entries,
    }

    # Write YAML
    with open(output_path, "w", encoding="utf-8") as f:
        yaml.dump(
            index_data, f, default_flow_style=False, allow_unicode=True, sort_keys=False
        )

    # Get file size
    file_size = output_path.stat().st_size
    log(f"Saved {len(chunks)} chunks ({file_size / 1024 / 1024:.2f} MB)")


def save_documents_index(
    documents: List[RawDocument],
    output_path: Path,
    config: Optional[Config] = None,
    generated_at: Optional[str] = None,
) -> None:
    """
    Save full document content for hierarchical retrieval.

    This creates a separate index mapping document paths to their complete content,
    enabling 'Parent Document Retrieval' where chunks are used for search but
    full documents are sent to the AI for richer context.
    """
    config = config or get_config()
    docs_output_path = output_path.parent / "rag-documents.yml"
    log(f"Saving documents index to {docs_output_path}...")

    if generated_at is None:
        generated_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    # Build documents index with full content and hierarchical info
    documents_data = {
        "version": "2.0.0",
        "generated_at": generated_at,
        "document_count": len(documents),
        "documents": {
            doc.path: {
                "title": doc.title,
                "description": doc.description,
                "category": doc.category,
                "url_path": doc.url_path,
                "content": doc.content,  # Full document content
                "word_count": len(doc.content.split()),
                "char_count": len(doc.content),
            }
            for doc in documents
        },
    }

    # Write YAML
    with open(docs_output_path, "w", encoding="utf-8") as f:
        yaml.dump(
            documents_data,
            f,
            default_flow_style=False,
            allow_unicode=True,
            sort_keys=False,
        )

    file_size = docs_output_path.stat().st_size
    log(f"Saved {len(documents)} documents ({file_size / 1024 / 1024:.2f} MB)")


def load_existing_chunks_from_state(state: Optional[BuildState]) -> List[DocumentChunk]:
    """Load cached chunks from build state instead of reparsing the generated index."""
    if state is None:
        return []

    chunks: List[DocumentChunk] = []
    for logical_path, file_state in state.files.items():
        for chunk_id, chunk_state in file_state.chunks.items():
            if not chunk_state.embedding:
                continue
            chunks.append(
                DocumentChunk(
                    id=f"{logical_path}-{chunk_id}",
                    text=chunk_state.text,
                    embedding=chunk_state.embedding,
                    metadata=chunk_state.metadata,
                )
            )
    return chunks


def build_rag_index(config: Optional[Config] = None) -> None:
    """Main build pipeline with incremental processing support."""
    config = config or get_config()
    log("=" * 60)
    log("RAG Prebuild Pipeline - llama.cpp Vulkan Edition")
    log("Incremental builds enabled")
    log("=" * 60)

    # 1. Load previous build state for incremental processing
    previous_state = load_build_state(config.state_path)
    if previous_state:
        log(f"Loaded previous build state ({len(previous_state.files)} files tracked)")
    else:
        log("No previous build state found - will perform full rebuild")

    # 2. Load all documents
    documents = load_all_documents(config.docs_dir)

    if not documents:
        log("No documents found")
        return

    # 3. Process into chunks with incremental change detection
    chunks_to_embed, new_state, skipped_count, total_chunks = (
        process_documents_incremental(documents, previous_state, config)
    )

    if total_chunks == 0:
        log("No chunks generated")
        return

    # 4. Load existing chunks if we're doing an incremental build
    existing_chunks: List[DocumentChunk] = []
    if skipped_count > 0 and previous_state:
        existing_chunks = load_existing_chunks_from_state(previous_state)
        log(f"Loaded {len(existing_chunks)} cached chunks from previous build state")

    # 5. Generate embeddings for new/changed chunks (if any)
    new_chunks: List[DocumentChunk] = []
    if chunks_to_embed:
        log(f"Generating embeddings for {len(chunks_to_embed)} new/modified chunks")
        try:
            with LlamaServerManager(config) as server:
                generator = LlamaEmbeddingGenerator(config.server_url)
                new_chunks = generator.embed_chunks(chunks_to_embed)
        except Exception as e:
            log(f"Embedding generation failed: {e}")
            raise
    else:
        log("No new embeddings needed - all chunks up to date")

    # 6. Merge new chunks with existing ones
    chunks_by_id = {chunk.id: chunk for chunk in existing_chunks}
    for chunk in new_chunks:
        chunks_by_id[chunk.id] = chunk
    all_chunks = list(chunks_by_id.values())

    # 7. Remove chunks from deleted files
    current_file_paths = {doc.path for doc in documents}
    all_chunks = [
        c for c in all_chunks if c.metadata.get("path", "") in current_file_paths
    ]

    # 8. Compute deterministic manifest hash and stable generated_at timestamp
    content_hashes = sorted([compute_hash(chunk.text) for chunk in all_chunks])
    manifest_hash = (
        compute_hash("".join(content_hashes)) if content_hashes else compute_hash("empty")
    )
    if previous_state and previous_state.manifest_hash == manifest_hash and previous_state.generated_at:
        generated_at = previous_state.generated_at
    else:
        generated_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    # 9. Update state with new embeddings
    final_state = finalize_state_with_embeddings(new_state, new_chunks)
    final_state.manifest_hash = manifest_hash
    final_state.generated_at = generated_at

    # 10. Save the updated state for next incremental build
    save_build_state(final_state, config.state_path)
    log(f"Saved build state ({len(final_state.files)} files)")

    # 11. Save the final index
    save_index(
        all_chunks,
        config.output_path,
        config,
        manifest_hash=manifest_hash,
        generated_at=generated_at,
    )

    # 12. Save the documents index for hierarchical retrieval
    save_documents_index(documents, config.output_path, config, generated_at=generated_at)

    log("=" * 60)
    log("Build complete")
    log(f"Chunk index: {config.output_path}")
    log(f"Document index: {config.output_path.parent / 'rag-documents.yml'}")
    log(f"Total chunks: {len(all_chunks)}")
    log(f"New/modified: {len(new_chunks)}")
    log(f"Skipped (cached): {skipped_count}")
    log(f"Dimensions: {config.dimensions}")
    log("GPU: Vulkan acceleration active")
    log("=" * 60)


# =============================================================================
# ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    # Change to docs directory if running from elsewhere
    script_dir = Path(__file__).parent
    if script_dir.name == "scripts":
        project_root = script_dir.parent
        os.chdir(project_root)
        # Re-initialize config with new working directory
        CONFIG = Config()

    build_rag_index()
