
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import type { Enums } from '@/integrations/supabase/types';
import type { ProfileWithRoles } from '@/hooks/useCrew';

type Role = Enums<'app_role'>;

const assignRoleSchema = z.object({
  userId: z.string().uuid().or(z.literal('unassigned')),
});

interface AssignRoleDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  role: Role;
  crew: ProfileWithRoles[];
  onAssignSuccess: () => void;
}

const AssignRoleDialog = ({ isOpen, onOpenChange, role, crew, onAssignSuccess }: AssignRoleDialogProps) => {
  const queryClient = useQueryClient();

  const assignedUser = crew.find(member => member.user_roles.some(r => r.role === role));

  const form = useForm<z.infer<typeof assignRoleSchema>>({
    resolver: zodResolver(assignRoleSchema),
    defaultValues: {
      userId: assignedUser?.id || 'unassigned',
    },
  });

  React.useEffect(() => {
    form.reset({
      userId: assignedUser?.id || 'unassigned',
    });
  }, [assignedUser, form]);

  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, role: roleToAssign }: { userId: string | 'unassigned', role: Role }) => {
      const currentHolder = crew.find(member => member.user_roles.some(r => r.role === roleToAssign));
      if (currentHolder) {
        const { error: deleteError } = await supabase
          .from('user_roles')
          .delete()
          .match({ user_id: currentHolder.id, role: roleToAssign });

        if (deleteError) {
          throw new Error(`Failed to unassign role: ${deleteError.message}`);
        }
      }

      if (userId !== 'unassigned') {
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: roleToAssign });

        if (insertError) {
          throw new Error(`Failed to assign role: ${insertError.message}`);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crew'] });
      toast.success('Role updated successfully!');
      onAssignSuccess();
    },
    onError: (error: Error) => {
      console.error('Failed to assign role', error);
      toast.error(error.message || 'Failed to update role. Please try again.');
    },
  });

  const onSubmit = (values: z.infer<typeof assignRoleSchema>) => {
    assignRoleMutation.mutate({ userId: values.userId, role });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Role: {role}</DialogTitle>
          <DialogDescription>
            Select a crew member to assign this role to. This will unassign the role from the current holder if any.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Crew Member</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a crew member" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {crew.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={assignRoleMutation.isPending}>
                {assignRoleMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AssignRoleDialog;
