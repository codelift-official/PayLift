import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Store, X } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../../components/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { usersApi, CreateUserPayload, UpdateUserPayload } from '../../../api/users';
import { shopsApi } from '../../../api/shops';

// --- Schemas ------------------------------------------------------------------

const createSchema = z.object({
  email: z.string().email('Valid email required'),
  mobile: z.string().optional(),
  name: z.string().optional(),
  password: z.string().min(8, 'Minimum 8 characters'),
  role: z.enum(['Manager', 'Staff']),
  assignedShopIDs: z.array(z.string()).min(1, 'Please select at least one shop.'),
});

const editSchema = z.object({
  mobile: z.string().optional(),
  name: z.string().optional(),
  role: z.enum(['Manager', 'Staff']),
  assignedShopIDs: z.array(z.string()).min(1, 'Please select at least one shop.'),
});

type CreateForm = z.infer<typeof createSchema>;
type EditForm = z.infer<typeof editSchema>;

// --- Component ----------------------------------------------------------------

export const UserFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const qc = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);

  const { data: shops = [], isLoading: shopsLoading } = useQuery({
    queryKey: ['shops'],
    queryFn: shopsApi.getShops,
  });

  const { data: existingUser, isLoading: userLoading } = useQuery({
    queryKey: ['users', id],
    queryFn: () => usersApi.getUserById(id!),
    enabled: isEdit,
  });

  // -- Create form -------------------------------------------------------------
  const {
    register: regCreate,
    handleSubmit: handleCreate,
    control: createControl,
    setValue: setCreateValue,
    watch: watchCreate,
    setError: setCreateError,
    formState: { errors: createErrors },
  } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    mode: 'onChange',
    defaultValues: { role: 'Staff', assignedShopIDs: [] },
  });

  // -- Edit form --------------------------------------------------------------
  const {
    register: regEdit,
    handleSubmit: handleEdit,
    control: editControl,
    setValue: setEditValue,
    reset,
    formState: { errors: editErrors },
  } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    mode: 'onChange',
    defaultValues: { role: 'Staff', assignedShopIDs: [] },
  });

  // Pre-select all shops if only one exists
  useEffect(() => {
    if (!isEdit && shops.length === 1) {
      setCreateValue('assignedShopIDs', [shops[0].id], { shouldValidate: true });
    }
  }, [shops, isEdit, setCreateValue]);

  useEffect(() => {
    if (existingUser) {
      const existingShops = Array.isArray(existingUser.assignedShopIDs) && existingUser.assignedShopIDs.length > 0
        ? existingUser.assignedShopIDs
        : Array.isArray((existingUser as any).shopAccesses)
          ? (existingUser as any).shopAccesses.map((sa: any) => sa.shopID || sa.id || sa)
          : [];

      reset({
        mobile: existingUser.mobile || '',
        name: existingUser.name || '',
        role: existingUser.role,
        assignedShopIDs: existingShops,
      });
    }
  }, [existingUser, reset]);

  // -- Mutations --------------------------------------------------------------
  const createMutation = useMutation({
    mutationFn: (data: CreateUserPayload) => usersApi.createUser(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created.');
      navigate('/settings/users');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error || err?.message || 'Failed to create user';
      setApiError(msg);
      toast.error(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateUserPayload) => usersApi.updateUser(id!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['users', id] });
      toast.success('User updated successfully');
      navigate('/settings/users');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error || err?.message || 'Failed to update user';
      setApiError(msg);
      toast.error(msg);
    },
  });

  const selectedCreateShops = watchCreate('assignedShopIDs') || [];
  const selectedCreateRole = watchCreate('role');
  const isCreateShopValid =
    (selectedCreateRole !== 'Manager' && selectedCreateRole !== 'Staff') ||
    selectedCreateShops.length > 0;

  const onCreateSubmit = (data: CreateForm) => {
    setApiError(null);
    const shopList = data.assignedShopIDs || [];
    if (
      (data.role === 'Manager' || data.role === 'Staff') &&
      shopList.length === 0
    ) {
      setCreateError('assignedShopIDs', {
        type: 'manual',
        message: 'Please select at least one shop.',
      });
      toast.error('Please select at least one shop.');
      return;
    }

    createMutation.mutate({
      ...data,
      mobile: data.mobile?.trim() || '9876543210',
      shopIDs: shopList,
      assignedShopIDs: shopList,
    });
  };

  const onEditSubmit = (data: EditForm) => {
    setApiError(null);
    const shopList = data.assignedShopIDs || [];
    updateMutation.mutate({
      ...data,
      shopIDs: shopList,
      assignedShopIDs: shopList,
    });
  };

  if (isEdit && userLoading) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--primary)' }} />
      </div>
    );
  }

  // -- Shared: shop checkbox section ------------------------------------------
  const ShopCheckboxes: React.FC<{
    control: any;
    errors: any;
    setValue: any;
  }> = ({ control, errors, setValue }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Assigned Shops <span className="text-red-500">*</span>
        </label>
        {shops.length >= 2 && (
          <button
            type="button"
            onClick={() => {
              setValue('assignedShopIDs', shops.map((s) => s.id), { shouldValidate: true });
            }}
            className="text-xs font-semibold hover:underline"
            style={{ color: 'var(--primary)' }}
          >
            Select All
          </button>
        )}
      </div>

      {shopsLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--primary)' }} />
      ) : (
        <Controller
          control={control}
          name="assignedShopIDs"
          render={({ field }) => {
            const currentSelected = (field.value as string[]) || [];

            return (
              <div className="space-y-3">
                {/* Selected chips: Main Shop x */}
                {currentSelected.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border" style={{ borderColor: 'var(--bg-border)', backgroundColor: 'var(--bg-app)' }}>
                    {currentSelected.map((shopId) => {
                      const shopObj = shops.find((s) => s.id === shopId);
                      const name = shopObj?.name || 'Shop';
                      return (
                        <span
                          key={shopId}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors"
                          style={{
                            borderColor: 'var(--primary)',
                            backgroundColor: 'rgba(229,57,53,0.1)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          {name}
                          <button
                            type="button"
                            onClick={() => {
                              field.onChange(currentSelected.filter((id) => id !== shopId));
                            }}
                            className="hover:text-red-600 rounded-full p-0.5"
                            title="Remove shop"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Checkbox list with shop name + address */}
                <div className="space-y-2">
                  {shops.map((shop) => {
                    const checked = currentSelected.includes(shop.id);
                    return (
                      <label
                        key={shop.id}
                        className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
                        style={{
                          borderColor: checked
                            ? 'var(--primary)'
                            : 'var(--bg-border)',
                          backgroundColor: checked
                            ? 'rgba(229,57,53,0.05)'
                            : 'var(--bg-app)',
                        }}
                      >
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded accent-primary"
                          checked={checked}
                          onChange={(e) => {
                            field.onChange(
                              e.target.checked
                                ? [...currentSelected, shop.id]
                                : currentSelected.filter((v) => v !== shop.id)
                            );
                          }}
                        />
                        <Store className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {shop.name}
                          </p>
                          {shop.address && (
                            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                              {shop.address}
                            </p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>

                {errors.assignedShopIDs && (
                  <p id="shop-selector-error" className="text-xs text-red-500 mt-1 font-medium">
                    {errors.assignedShopIDs.message as string}
                  </p>
                )}
                {!errors.assignedShopIDs && currentSelected.length === 0 && (
                  <p id="shop-selector-error" className="text-xs text-red-500 mt-1 font-medium">
                    Please select at least one shop.
                  </p>
                )}
              </div>
            );
          }}
        />
      )}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 sm:pb-8">
      {/* Back link */}
      <Link
        to="/settings/users"
        className="inline-flex items-center text-xs font-semibold hover:text-primary transition-colors"
        style={{ color: 'var(--text-muted)' }}
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Team
      </Link>

      <PageHeader
        title={isEdit ? 'Edit Team Member' : 'Invite Team Member'}
        subtitle={
          isEdit
            ? `Editing ${existingUser?.name || existingUser?.email}`
            : 'Add a Manager or Staff member to your team'
        }
      />

      {apiError && (
        <div id="user-form-api-error" className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
          {apiError}
        </div>
      )}

      {/* -- CREATE FORM ------------------------------------------------------- */}
      {!isEdit && (
        <form onSubmit={handleCreate(onCreateSubmit)} className="space-y-5">
          <Card className="p-5 space-y-4 shadow-card border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
            <Input
              id="create-email"
              label="Email Address"
              type="email"
              placeholder="staff@yourstore.com"
              {...regCreate('email')}
              error={createErrors.email?.message}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="create-name"
                label="Full Name"
                placeholder="e.g. Ravi Kumar"
                {...regCreate('name')}
                error={createErrors.name?.message}
              />
              <Input
                id="create-mobile"
                label="Mobile"
                placeholder="9876543210"
                {...regCreate('mobile')}
                error={createErrors.mobile?.message}
              />
            </div>
            <Input
              id="create-password"
              label="Temporary Password"
              type="password"
              placeholder="Min 8 characters"
              {...regCreate('password')}
              error={createErrors.password?.message}
            />

            {/* Role selector */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Role <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(['Manager', 'Staff'] as const).map((r) => (
                  <label
                    key={r}
                    className="flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors"
                    style={{ borderColor: 'var(--bg-border)', backgroundColor: 'var(--bg-app)' }}
                  >
                    <input
                      type="radio"
                      value={r}
                      {...regCreate('role')}
                      className="accent-primary"
                    />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{r}</p>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        {r === 'Manager'
                          ? 'Full access except Admin settings'
                          : 'Bills & returns only'}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
              {createErrors.role && (
                <p className="text-xs text-red-500">{createErrors.role.message}</p>
              )}
            </div>

            <ShopCheckboxes control={createControl} errors={createErrors} setValue={setCreateValue} />
          </Card>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/settings/users')}
            >
              Cancel
            </Button>
            <Button
              id="btn-create-user"
              type="submit"
              variant="primary"
              disabled={!isCreateShopValid}
              isLoading={createMutation.isPending}
            >
              Send Invite
            </Button>
          </div>
        </form>
      )}

      {/* -- EDIT FORM --------------------------------------------------------- */}
      {isEdit && (
        <form onSubmit={handleEdit(onEditSubmit)} className="space-y-5">
          <Card className="p-5 space-y-4 shadow-card border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
            {/* Read-only email */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
                Email (read-only)
              </label>
              <p
                className="text-sm font-mono px-3 py-2 rounded-lg border"
                style={{ borderColor: 'var(--bg-border)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}
              >
                {existingUser?.email}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="edit-name"
                label="Full Name"
                placeholder="e.g. Ravi Kumar"
                {...regEdit('name')}
                error={editErrors.name?.message}
              />
              <Input
                id="edit-mobile"
                label="Mobile"
                placeholder="9876543210"
                {...regEdit('mobile')}
                error={editErrors.mobile?.message}
              />
            </div>

            {/* Role selector */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Role <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(['Manager', 'Staff'] as const).map((r) => (
                  <label
                    key={r}
                    className="flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors"
                    style={{ borderColor: 'var(--bg-border)', backgroundColor: 'var(--bg-app)' }}
                  >
                    <input
                      type="radio"
                      value={r}
                      {...regEdit('role')}
                      className="accent-primary"
                    />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{r}</p>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        {r === 'Manager'
                          ? 'Full access except Admin settings'
                          : 'Bills & returns only'}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
              {editErrors.role && (
                <p className="text-xs text-red-500">{editErrors.role.message}</p>
              )}
            </div>

            <ShopCheckboxes control={editControl} errors={editErrors} setValue={setEditValue} />
          </Card>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/settings/users')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={updateMutation.isPending}
            >
              Save Changes
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
