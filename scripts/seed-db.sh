wrangler kv namespace create ENDEN_LINK_URLS --remote
wrangler kv key put --binding ENDEN_LINK_URLS --preview false --remote "linkedin" "url: https://www.linkedin.com/in/rafenden/"
wrangler kv key put --binding ENDEN_LINK_URLS --preview false --remote "stackoverflow" "url: https://stackoverflow.com/users/3042543/rafal-enden"
wrangler kv key put --binding ENDEN_LINK_URLS --preview false --remote "soundcloud" "url: https://soundcloud.com/rafenden"
wrangler kv key put --binding ENDEN_LINK_URLS --preview false --remote "from-cv" "url: https://enden.com"