# Home

User-directed work replaces the numbered rollout. Home is one common announcement feed for all signed-in members. Only the configured Google owner can publish; the server enforces this independently of the + button. Posts contain title, description, emoji and up to four uploaded images/GIFs (6 MB each). Image files use private disk storage, validated/re-encoded JPEG/PNG/WebP/GIF input, and authenticated media reads. No external GIF search or tracking provider is required: choose a GIF from the phone.

Active feed code no longer queries memberships or offers scopes. Historical private feed records remain stored and excluded through a migration view; they are not silently made public. Other features retain their independent access controls. Historical migrations must remain intact for checksummed upgrades. Obsolete scoped-feed tests have been replaced by shared Home authorization, upload, pagination and reply checks.

Test: admin opens Home +, enters title/text, inserts emoji and attaches a photo/GIF. Publish and refresh. A second ordinary account must see the same post without a + button and cannot publish by direct API request. Replies remain available. The Ghost preview never writes real data. Canceled uploads can leave unattached files; background media garbage collection is not yet implemented.
