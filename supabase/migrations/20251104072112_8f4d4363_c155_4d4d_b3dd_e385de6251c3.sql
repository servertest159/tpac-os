-- Make gear-uploads bucket public so images can be accessed
UPDATE storage.buckets 
SET public = true 
WHERE name = 'gear-uploads';