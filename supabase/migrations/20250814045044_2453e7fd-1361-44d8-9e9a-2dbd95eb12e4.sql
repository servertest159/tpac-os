-- Remove the three Pulau Ubin events
DELETE FROM events WHERE id IN (
  '4870000d-44d3-4d74-9ac0-bd5e179a038e', -- Pulau Ubin Bonding Camp
  'a70e8ae5-6b93-4f35-9ce0-dd7bfa73e2b2', -- Pulau Ubin Camp  
  '205da9cb-3ce4-4e9b-8f8d-3a029436adc7'  -- Ubin Kayak Patrol
);