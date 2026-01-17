import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://vhfdtequcekmmwoiikhm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoZmR0ZXF1Y2VrbW13b2lpa2htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NzI3NDEsImV4cCI6MjA4NDI0ODc0MX0.FWGLnZ4w0BfNwWYb5_MM0n7v2iyojZaRB14BbB7pdKM";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
