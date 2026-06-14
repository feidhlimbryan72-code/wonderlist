-- =======================================================
-- ADD ROLE COLUMN TO LIST_SHARES AND IMPLEMENT RBAC
-- =======================================================

-- 1. Add role column to list_shares table
ALTER TABLE public.list_shares 
ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'member' CHECK (role in ('admin', 'member', 'viewer'));

-- 2. Define the security definer role helper function to prevent circular dependency
CREATE OR REPLACE FUNCTION public.get_list_role(_list_id uuid, _user_id uuid)
RETURNS text AS $$
DECLARE
  _owner_id uuid;
  _email text;
  _role text;
  _status text;
BEGIN
  -- Get list owner
  SELECT owner_id INTO _owner_id FROM public.lists WHERE id = _list_id;
  IF _owner_id = _user_id THEN
    RETURN 'owner';
  END IF;

  -- Get user email
  SELECT email INTO _email FROM public.profiles WHERE id = _user_id;
  IF _email IS NULL THEN
    RETURN NULL;
  END IF;

  -- Get share role
  SELECT role, status INTO _role, _status FROM public.list_shares 
  WHERE list_id = _list_id AND lower(invited_email) = lower(_email);
  
  IF _status = 'accepted' THEN
    RETURN _role;
  ELSE
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Drop existing policies to rebuild them
DROP POLICY IF EXISTS "Users can view lists they own or are shared with" ON public.lists;
DROP POLICY IF EXISTS "Users can update lists they own or are shared with" ON public.lists;
DROP POLICY IF EXISTS "Users can view shares for lists they own or are invited to" ON public.list_shares;
DROP POLICY IF EXISTS "Only list owners can insert shares" ON public.list_shares;
DROP POLICY IF EXISTS "Only list owners or admins can insert shares" ON public.list_shares;
DROP POLICY IF EXISTS "Users can update shares (accept invite or owner updates)" ON public.list_shares;
DROP POLICY IF EXISTS "Users can delete shares (owner cancels or invitee rejects)" ON public.list_shares;
DROP POLICY IF EXISTS "Users can perform actions on tasks if they have access to the parent list" ON public.tasks;
DROP POLICY IF EXISTS "Admins, members and owners can modify tasks" ON public.tasks;

-- 4. Rebuild Lists policies
CREATE POLICY "Users can view lists they own or are shared with"
  ON public.lists FOR SELECT
  USING (
    owner_id = auth.uid() OR 
    id IN (
      SELECT list_id FROM public.list_shares 
      WHERE invited_email = lower(auth.jwt()->>'email')
    )
  );

CREATE POLICY "Users can update lists they own or are shared with"
  ON public.lists FOR UPDATE
  USING (
    public.get_list_role(id, auth.uid()) IN ('owner', 'admin')
  );

-- 5. Rebuild List Shares policies
CREATE POLICY "Users can view shares for lists they own or are invited to"
  ON public.list_shares FOR SELECT
  USING (
    invited_email = lower(auth.jwt()->>'email') OR
    public.get_list_role(list_id, auth.uid()) IN ('owner', 'admin')
  );

CREATE POLICY "Only list owners or admins can insert shares"
  ON public.list_shares FOR INSERT
  WITH CHECK (
    public.get_list_role(list_id, auth.uid()) IN ('owner', 'admin')
  );

CREATE POLICY "Users can update shares (accept invite or owner updates)"
  ON public.list_shares FOR UPDATE
  USING (
    invited_email = lower(auth.jwt()->>'email') OR
    public.get_list_role(list_id, auth.uid()) IN ('owner', 'admin')
  );

CREATE POLICY "Users can delete shares (owner cancels or invitee rejects)"
  ON public.list_shares FOR DELETE
  USING (
    invited_email = lower(auth.jwt()->>'email') OR
    public.get_list_role(list_id, auth.uid()) IN ('owner', 'admin')
  );

-- 6. Rebuild Tasks policies (Owners, Admins, and Members can view and modify tasks, Viewers can only view)
CREATE POLICY "Users can perform actions on tasks if they have access to the parent list"
  ON public.tasks FOR SELECT
  USING (
    public.get_list_role(list_id, auth.uid()) IS NOT NULL
  );

CREATE POLICY "Admins, members and owners can modify tasks"
  ON public.tasks FOR ALL
  USING (
    public.get_list_role(list_id, auth.uid()) IN ('owner', 'admin', 'member')
  );
