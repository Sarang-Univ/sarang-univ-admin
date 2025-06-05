import useSWR from "swr";
import { webAxios } from "@/lib/api/axios";
import {
  // UserRetreatRegistrationType, >> 새가족, 군인, ...
  UserRetreatShuttleBusPaymentStatus // UserRetreatRegistrationPaymentStatus,
} from "@/types";
import Cookies from "js-cookie";

export interface IUserScheduleChangeShuttleBus {
  price: number;
  paymentStatus: UserRetreatShuttleBusPaymentStatus;
  paymentConfirmedAt: string | null;
  userName: string;
  createdAt: string;
  userRetreatShuttleBusRegistrationId: number;
  userRetreatShuttleBusRegistrationHistoryMemoId: number;
  univGroupNumber: number;
  gradeNumber: number;
  userRetreatShuttleBusRegistrationScheduleIds: number[];
  memo: string;
  issuerName: string;
  memoCreatedAt: string;
}

const fetcher = async (url: string) => {
  const accessToken = Cookies.get("accessToken");
  const response = await webAxios.get(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data.shuttleBusScheduleChangeRequests;
};

export function useUserScheduleChangeShuttleBus(retreatSlug?: string) {
  const endpoint = retreatSlug
    ? `/api/v1/retreat/${retreatSlug}/shuttle-bus/bus-registration-change-request`
    : null;
  
  return useSWR<IUserScheduleChangeShuttleBus[], Error>(endpoint, fetcher);

}
