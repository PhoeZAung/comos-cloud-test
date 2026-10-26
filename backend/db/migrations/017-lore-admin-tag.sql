-- Reserved, server-authorized Admin tag. Existing user-defined "Admin" labels
-- are renamed before the privileged tag is inserted: they must not inherit access.
UPDATE character_tags
SET name='Admin (legacy ' || substr(id,1,8) || ')'
WHERE name='Admin' COLLATE NOCASE
  AND id<>'00000000-0000-4000-8000-0000000000ad';
INSERT INTO character_tags(id,name)
VALUES('00000000-0000-4000-8000-0000000000ad','Admin')
ON CONFLICT(id) DO NOTHING;
