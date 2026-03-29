import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';

import { Button } from '@src/components/atoms/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@src/components/atoms/card';
import { Input } from '@src/components/atoms/input';
import { Label } from '@src/components/atoms/label';
import { Skeleton } from '@src/components/atoms/skeleton';
import { useUpdateUser } from '@src/hooks/mutations/useUpdateUser';
import { useProfile } from '@src/hooks/useProfile';

export const Route = createFileRoute('/_authentication/settings/security')({
  component: SettingsSecurityPage,
});

function validatePassword(password: string): string | null {
  if (password.length < 12) {
    return 'Password must be at least 12 characters.';
  }
  let hasLetter = false;
  let hasNumber = false;
  for (const char of password) {
    if (/[a-zA-Z]/.test(char)) hasLetter = true;
    if (/[0-9]/.test(char)) hasNumber = true;
    if (hasLetter && hasNumber) return null;
  }
  return 'Password must contain at least 1 letter and 1 number.';
}

function SettingsSecurityPage() {
  const { data: profile, isLoading, isError, error } = useProfile();

  const updateUser = useUpdateUser(profile?.id ?? '');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors: Record<string, string> = {};

    if (!currentPassword) {
      validationErrors.currentPassword = 'Current password is required.';
    }

    const passwordError = validatePassword(newPassword);
    if (!newPassword) {
      validationErrors.newPassword = 'New password is required.';
    } else if (passwordError) {
      validationErrors.newPassword = passwordError;
    }

    if (newPassword !== confirmPassword) {
      validationErrors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    updateUser.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        },
      },
    );
  };

  if (isError) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Security</h2>
          <p className="text-muted-foreground">Manage your password and security settings.</p>
        </div>
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="py-6 text-center">
            <p className="text-sm text-destructive">
              Failed to load profile: {error?.message || 'An unexpected error occurred.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Security</h2>
        <p className="text-muted-foreground">Manage your password and security settings.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your password. Must be at least 12 characters with at least 1 letter and 1
            number.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : (
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                {errors.currentPassword && (
                  <p className="text-sm text-destructive">{errors.currentPassword}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                {errors.newPassword && (
                  <p className="text-sm text-destructive">{errors.newPassword}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                )}
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={updateUser.isPending}>
                  {updateUser.isPending ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
