import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deliveryApi, type DeliveryZoneInput } from '../api/delivery.api';

const zonesKey = ['delivery-zones'] as const;
const settingsKey = ['checkout-settings'] as const;

export const useDeliveryZones = () => useQuery({ queryKey: zonesKey, queryFn: deliveryApi.zones });

export const useSaveDeliveryZone = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, body }: { id?: string; body: DeliveryZoneInput }) =>
            id ? deliveryApi.updateZone(id, body) : deliveryApi.createZone(body),
        onSuccess: () => qc.invalidateQueries({ queryKey: zonesKey }),
    });
};

export const useDeleteDeliveryZone = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deliveryApi.deleteZone(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: zonesKey }),
    });
};

export const useCheckoutSettings = () => useQuery({ queryKey: settingsKey, queryFn: deliveryApi.settings });

export const useUpdateCheckoutSettings = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: deliveryApi.updateSettings,
        onSuccess: () => qc.invalidateQueries({ queryKey: settingsKey }),
    });
};
