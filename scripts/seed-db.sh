wrangler kv namespace create ENDEN_LINK_URLS --remote
wrangler kv key put --binding ENDEN_LINK_URLS --preview false --remote "linkedin" "url: https://www.linkedin.com/in/rafenden/"
wrangler kv key put --binding ENDEN_LINK_URLS --preview false --remote "stackoverflow" "url: https://stackoverflow.com/users/3042543/rafal-enden"
wrangler kv key put --binding ENDEN_LINK_URLS --preview false --remote "soundcloud" "url: https://soundcloud.com/rafenden"
wrangler kv key put --binding ENDEN_LINK_URLS --preview false --remote "site" "url: https://enden.com"
wrangler kv key put --binding ENDEN_LINK_URLS --preview false --remote "analytics" "url: https://dash.cloudflare.com/ACCOUNT_ID/workers/analytics-engine/studio"
wrangler kv key put --binding ENDEN_LINK_URLS --preview false --remote "manage-links" "url: https://dash.cloudflare.com/ACCOUNT_ID/workers/kv/namespaces/KV_NAMESPACE_ID"