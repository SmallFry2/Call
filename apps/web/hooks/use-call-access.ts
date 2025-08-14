"use client";

import { useEffect, useCallback } from "react";
import { useCallContext } from "@/contexts/call-context";
import { toast } from "sonner";
export const useCallAccess = () => {
  const {
    state,
    dispatch,
    session: { user },
  } = useCallContext();

  useEffect(() => {
    const fetchCreatorInfo = async () => {
      if (!state.callId) return;

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/calls/${state.callId}/creator`,
          {
            credentials: "include",
          }
        );

        if (response.ok) {
          const data = await response.json();
          dispatch({ type: "SET_CREATOR_INFO", payload: data.creator });
        } else if (response.status === 404) {
          // Not a persisted call: treat as anonymous/open room
          dispatch({ type: "SET_CREATOR_INFO", payload: null });
          dispatch({ type: "SET_HAS_ACCESS", payload: true });
          dispatch({ type: "SET_CREATOR", payload: false });
        }
      } catch (error) {
        console.error("Error fetching creator info:", error);
      }
    };

    fetchCreatorInfo();
  }, [state.callId, dispatch]);

  useEffect(() => {
    if (state.joined || !state.callId) return;

    // Guest users: allow direct join without backend checks
    if (!user?.id || user.id === "guest") {
      dispatch({ type: "SET_HAS_ACCESS", payload: true });
      dispatch({ type: "SET_CREATOR", payload: false });
      return;
    }

    const checkAccess = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/calls/${state.callId}/check-access`,
          {
            credentials: "include",
          }
        );

        if (response.ok) {
          const data = await response.json();
          dispatch({ type: "SET_HAS_ACCESS", payload: data.hasAccess });
          dispatch({ type: "SET_CREATOR", payload: data.isCreator });
        } else if (response.status === 404) {
          // Call not in DB → anonymous/open room
          dispatch({ type: "SET_HAS_ACCESS", payload: true });
          dispatch({ type: "SET_CREATOR", payload: false });
        }
      } catch (error) {
        console.error("Error checking call access:", error);
      }
    };

    checkAccess();
    const interval = setInterval(checkAccess, 3000);
    return () => clearInterval(interval);
  }, [state.callId, user?.id, state.joined, dispatch]);

  const handleRequestAccess = useCallback(async () => {
    if (!state.callId) return;
    // For anonymous rooms, skip request logic
    if (!user?.id || user.id === "guest") {
      toast.info("Joining as guest. No approval required.");
      return;
    }

    dispatch({ type: "SET_REQUESTING_ACCESS", payload: true });
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/calls/${state.callId}/request-join`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (response.ok) {
        toast.success("Request sent! Please wait for the host to approve.");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to send request");
      }
    } catch (error) {
      console.error("Error requesting access:", error);
      toast.error("Failed to send request");
    } finally {
      dispatch({ type: "SET_REQUESTING_ACCESS", payload: false });
    }
  }, [state.callId, user?.id, dispatch]);

  return {
    isCreator: state.isCreator,
    hasAccess: state.hasAccess,
    isRequestingAccess: state.isRequestingAccess,
    creatorInfo: state.creatorInfo,
    handleRequestAccess,
  };
};
