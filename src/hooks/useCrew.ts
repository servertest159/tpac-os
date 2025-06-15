
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, Enums } from '@/integrations/supabase/types';

export type ProfileWithRoles = Tables<'profiles'> & {
  user_roles: {
    role: Enums<'app_role'>;
  }[];
};

const fetchCrew = async (): Promise<ProfileWithRoles[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      avatar_url,
      user_roles (
        role
      )
    `);

  if (error) {
    console.error('Error fetching crew:', error);
    throw error;
  }

  // Supabase returns user_roles as `any` when joined, so we cast it.
  return (data as ProfileWithRoles[]) || [];
};

export const useCrew = () => {
  return useQuery({
    queryKey: ['crew'],
    queryFn: fetchCrew,
  });
};
