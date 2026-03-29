import { useState } from 'react';
import { Loader2, Plus } from 'lucide-react';

import { Button } from '@src/components/atoms/button';
import { Input } from '@src/components/atoms/input';
import { Label } from '@src/components/atoms/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@src/components/atoms/sheet';
import { useCreateOrganization } from '@src/hooks/mutations/useCreateOrganization';

export function CreateOrganizationDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  const createOrganization = useCreateOrganization();

  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    setSlug(generateSlug(newName));
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(generateSlug(e.target.value));
  };

  const resetForm = () => {
    setName('');
    setSlug('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createOrganization.mutate(
      {
        name: name.trim(),
        slug: slug.trim(),
      },
      {
        onSuccess: () => {
          resetForm();
          setOpen(false);
        },
      },
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 size-4" />
          Add Organization
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Create Organization</SheetTitle>
          <SheetDescription>Add a new organization to the platform.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="orgName">Name</Label>
            <Input
              id="orgName"
              value={name}
              onChange={handleNameChange}
              required
              placeholder="Acme Inc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="orgSlug">Slug</Label>
            <Input
              id="orgSlug"
              value={slug}
              onChange={handleSlugChange}
              required
              placeholder="acme-inc"
              pattern="^[a-z0-9-]+$"
              title="Lowercase alphanumeric characters and hyphens only"
            />
            <p className="text-xs text-muted-foreground">
              Lowercase alphanumeric characters and hyphens only.
            </p>
          </div>

          <Button type="submit" className="mt-2" disabled={createOrganization.isPending}>
            {createOrganization.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            {createOrganization.isPending ? 'Creating...' : 'Create Organization'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
