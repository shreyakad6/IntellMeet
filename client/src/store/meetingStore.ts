import { create } from 'zustand';

interface MeetingState {
  currentMeeting: any | null;
  isAudioMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  isRecording: boolean;
  captionsEnabled: boolean;
  activeSidebarTab: 'chat' | 'participants' | 'info' | null;

  setCurrentMeeting: (meeting: any | null) => void;
  toggleAudio: () => void;
  toggleVideo: () => void;
  setAudioMuted: (muted: boolean) => void;
  setVideoOff: (videoOff: boolean) => void;
  setIsScreenSharing: (isSharing: boolean) => void;
  setIsRecording: (isRecording: boolean) => void;
  toggleCaptions: () => void;
  setActiveSidebarTab: (tab: 'chat' | 'participants' | 'info' | null) => void;
  resetMeetingState: () => void;
}

export const useMeetingStore = create<MeetingState>((set) => ({
  currentMeeting: null,
  isAudioMuted: false,
  isVideoOff: false,
  isScreenSharing: false,
  isRecording: false,
  captionsEnabled: false,
  activeSidebarTab: null,

  setCurrentMeeting: (meeting) => set({ currentMeeting: meeting }),
  toggleAudio: () => set((state) => ({ isAudioMuted: !state.isAudioMuted })),
  toggleVideo: () => set((state) => ({ isVideoOff: !state.isVideoOff })),
  setAudioMuted: (isAudioMuted) => set({ isAudioMuted }),
  setVideoOff: (isVideoOff) => set({ isVideoOff }),
  setIsScreenSharing: (isScreenSharing) => set({ isScreenSharing }),
  setIsRecording: (isRecording) => set({ isRecording }),
  toggleCaptions: () => set((state) => ({ captionsEnabled: !state.captionsEnabled })),
  setActiveSidebarTab: (tab) =>
    set((state) => ({ activeSidebarTab: state.activeSidebarTab === tab ? null : tab })),
  resetMeetingState: () =>
    set({
      currentMeeting: null,
      isAudioMuted: false,
      isVideoOff: false,
      isScreenSharing: false,
      isRecording: false,
      captionsEnabled: false,
      activeSidebarTab: null
    })
}));
