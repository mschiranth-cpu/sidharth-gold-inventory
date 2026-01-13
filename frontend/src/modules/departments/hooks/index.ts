import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentsService } from '../services';
import { CreateDepartmentRequest, UpdateDepartmentRequest } from '../types';
import toast from 'react-hot-toast';

const DEPARTMENTS_KEY = 'departments';

export const useDepartments = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: [DEPARTMENTS_KEY, page, limit],
    queryFn: () => departmentsService.getAll(page, limit),
  });
};

export const useDepartment = (id: string) => {
  return useQuery({
    queryKey: [DEPARTMENTS_KEY, id],
    queryFn: () => departmentsService.getById(id),
    enabled: !!id,
  });
};

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDepartmentRequest) => departmentsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DEPARTMENTS_KEY] });
      toast.success('Department created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create department');
    },
  });
};

export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDepartmentRequest }) =>
      departmentsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DEPARTMENTS_KEY] });
      toast.success('Department updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update department');
    },
  });
};

export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => departmentsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DEPARTMENTS_KEY] });
      toast.success('Department deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to delete department');
    },
  });
};
