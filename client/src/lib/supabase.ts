import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://drfrtrsajarqnowkmdlw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyZnJ0cnNhamFycW5vd2ttZGx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMzQ0MzAsImV4cCI6MjA4NzYxMDQzMH0.iuEtfFGs5BdGBEI9tFsBAinBpo_d9xlaeJcEu02ZJiQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
