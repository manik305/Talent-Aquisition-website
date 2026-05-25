# TalentSphere Backend Package

import httpx

# Monkeypatch httpx.Client to support legacy proxies argument from older openai libraries
if hasattr(httpx.Client, "__init__") and not getattr(httpx.Client.__init__, "_is_patched", False):
    original_init = httpx.Client.__init__
    def patched_init(self, *args, **kwargs):
        if 'proxies' in kwargs:
            kwargs['proxy'] = kwargs.pop('proxies')
        original_init(self, *args, **kwargs)
    patched_init._is_patched = True
    httpx.Client.__init__ = patched_init

if hasattr(httpx.AsyncClient, "__init__") and not getattr(httpx.AsyncClient.__init__, "_is_patched", False):
    original_async_init = httpx.AsyncClient.__init__
    def patched_async_init(self, *args, **kwargs):
        if 'proxies' in kwargs:
            kwargs['proxy'] = kwargs.pop('proxies')
        original_async_init(self, *args, **kwargs)
    patched_async_init._is_patched = True
    httpx.AsyncClient.__init__ = patched_async_init

