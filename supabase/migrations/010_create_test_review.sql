-- Create a test admin review
INSERT INTO admin_reviews (
  artwork_id,
  review_type,
  status,
  image_url,
  customer_name,
  customer_email,
  pet_name,
  created_at
) VALUES (
  'c3340d72-94d4-40b6-8dee-44e9422e5bb4',
  'artwork_proof',
  'pending',
  'https://nwqwtmudwbdkyjfyzlyg.supabase.co/storage/v1/object/public/artwork-images/c3340d72-94d4-40b6-8dee-44e9422e5bb4/artwork_final_1758658253122.jpg',
  'vince xi',
  'vxi@live.ca',
  'Test Pet',
  NOW()
);
