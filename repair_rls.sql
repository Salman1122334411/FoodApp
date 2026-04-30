-- 1. Enable RLS on all addon tables
ALTER TABLE "AddonGroup" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "AddonOption" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "MenuItemAddon" DISABLE ROW LEVEL SECURITY;

ALTER TABLE "AddonGroup" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AddonOption" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MenuItemAddon" ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to ensure a clean state
DROP POLICY IF EXISTS "Allow public read access for AddonGroups" ON "AddonGroup";
DROP POLICY IF EXISTS "Allow public read access for AddonOptions" ON "AddonOption";
DROP POLICY IF EXISTS "Allow public read access for MenuItemAddons" ON "MenuItemAddon";

-- 3. Create Public SELECT policies so customers (anon) can ALWAYS see the menu
CREATE POLICY "Allow public read access for AddonGroups" 
ON "AddonGroup" FOR SELECT USING (true);

CREATE POLICY "Allow public read access for AddonOptions" 
ON "AddonOption" FOR SELECT USING (true);

CREATE POLICY "Allow public read access for MenuItemAddons" 
ON "MenuItemAddon" FOR SELECT USING (true);

-- 4. Grant explicit SELECT access to public roles
GRANT SELECT ON "AddonGroup" TO anon, authenticated;
GRANT SELECT ON "AddonOption" TO anon, authenticated;
GRANT SELECT ON "MenuItemAddon" TO anon, authenticated;
