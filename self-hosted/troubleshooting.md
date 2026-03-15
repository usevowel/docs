# Self-Hosted Troubleshooting

Use this page to narrow down the most common self-hosted failures.

## Token Issuance Fails

Check:

- Core is running and reachable
- required secrets are present
- your token endpoint is returning a valid response shape
- the client is calling the correct endpoint

## Realtime Connection Fails

Check:

- the WebSocket endpoint is reachable
- the token has not expired
- the token was minted for the intended environment
- TLS and proxy settings allow WebSocket upgrades

## Browser Microphone Issues

Check:

- the app is running on HTTPS, or localhost during development
- the browser has microphone permission
- the selected device is available

## Provider Misconfiguration

Check:

- provider credentials are present in the environment
- the configured model and voice values are supported
- any upstream quotas or provider errors are visible in logs

## Port, Host, Or Proxy Issues

Check:

- your public URLs match the deployment environment
- reverse proxies forward upgrade requests for WebSockets
- browser origins match the allowed deployment configuration
