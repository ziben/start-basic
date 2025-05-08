import { useQuery, QueryKey, QueryFunction } from '@tanstack/react-query';

type DataType = 'static' | 'dynamic' | 'user';

export const useCustomQuery = <TData, TError>(
  queryKey: QueryKey,
  queryFn: QueryFunction<TData>,
  dataType: DataType,
  options: any = {}
) => {
  // 根据数据类型设置不同的缓存时间
  const staleTime = getStaleTime(dataType);
  
  return useQuery<TData, TError>({
    queryKey,
    queryFn,
    staleTime,
    ...options,
  });
};

const getStaleTime = (dataType: DataType): number => {
  switch (dataType) {
    case 'static':
      return 1000 * 60 * 60; // 1 hour for static data
    case 'dynamic':
      return 1000 * 60 * 5; // 5 minutes for dynamic data
    case 'user':
      return 1000 * 30; // 30 seconds for user data
    default:
      return 1000 * 60; // 1 minute as default
  }
};