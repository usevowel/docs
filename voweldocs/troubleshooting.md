# Security and Troubleshooting

## Security Considerations

- Credentials are stored in browser localStorage (per-user, not shared)
- App IDs and JWTs should be treated as sensitive tokens
- JWT mode is recommended for production self-hosted deployments
- Environment variables are only used for pre-filling the UI, not for server-side rendering

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Voice agent not appearing | Check browser console for initialization errors |
| "No voice configuration found" | Click the voweldocs button and configure credentials |
| JWT URL not detected | Verify JWT format (should have `url`, `endpoint`, or `rtu` claim) |
| Navigation not working | Check that routes-manifest.ts is generated (run build) |
| Microphone not working | Ensure HTTPS (required outside localhost) |
| AI answers seem wrong | Enable RAG debug (`VITE_VOWEL_DEBUG_RAG=true`) to see what docs were retrieved |
| RAG not finding results | Check that `rag-index.yml` exists in `public/` and was generated at build time |

## Further Reading

- [Vowel Client Guide](/guide/vowel-client)
- [React Integration](/guide/react)
- [Self-Hosted Stack](/self-hosted/)
- [Haven VectorDB](https://github.com/kyrillosishak/Haven) - Privacy-first browser-based RAG
- [vowel.to Platform](https://vowel.to)
