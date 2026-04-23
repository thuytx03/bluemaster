import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import $ from "jquery";
import { ExportState } from "src/interfaces/facebook.interface";
import { removeCacheStorage } from "src/utils/common.util";
import { getUserID } from "src/utils/facebook.util";

// ─── Constants ────────────────────────────────────────────────────────────────

const FB_API_URL = "https://www.facebook.com/api/graphql";
const REQUEST_DELAY_MS = 1500;
const INVALID_NAMES = [
  "Người dùng Facebook",
  "Facebook User",
  "Facebook user",
  "facebook user",
];

// ─── Types ────────────────────────────────────────────────────────────────────

type ScanStatus = "continue" | "stop";

interface ScraperConfig {
  indexOption: number;
  options: string[];
  postId: string;
  isNextPage: boolean;
  type: string;
  cursorEnd: string | null;
  timeoutId: NodeJS.Timeout | null;
  fb_dtsg: string | null;
  status: ScanStatus;
}

// ─── Helpers (pure, outside hook) ────────────────────────────────────────────

export const getIdFromUrl = (url: string): string =>
  url.split("/").filter(Boolean).pop() ?? "";

const isEncodedPostId = (url: string): boolean =>
  getIdFromUrl(url).startsWith("pfbid");

export const getCookie = (name: string): string => {
  const prefix = name + "=";
  for (let cookie of document.cookie.split(";")) {
    cookie = cookie.trim();
    if (cookie.startsWith(prefix)) return cookie.slice(prefix.length);
  }
  return "";
};

const buildBasePayload = (userId: string, fb_dtsg: string | null) => ({
  av: userId,
  __user: userId,
  __a: 1,
  __dyn: "",
  __req: "1c",
  __be: 1,
  __pc: "PHASED: ufi_home_page_pkg",
  dpr: 1,
  __comet_req: false,
  fb_dtsg,
  jazoest: 0x63cf,
  __ccg: "GOOD",
  __rev: 0x3c8e5ef1,
  __spin_r: 0x3c8e5ef1,
  __spin_b: "trunk",
  __spin_t: Date.now(),
  server_timestamps: true,
});

// ─── Hook ─────────────────────────────────────────────────────────────────────

const INITIAL_STATE: ExportState = {
  isLayoutExportUid: false,
  count: 0,
  options: [],
  arrUID: [],
  status: "continue",
  success: false,
};

export const useFacebookScraper = (textAreaRef: React.RefObject<HTMLTextAreaElement | null>) => {
  const [state, setState] = useState<ExportState>(INITIAL_STATE);

  const groupID = useMemo(() => getIdFromUrl(window.location.href), []);
  const userID = useMemo(() => getCookie("c_user"), []);

  // All mutable scraping state lives here — avoids stale closure issues
  const cfg = useRef<ScraperConfig>({
    indexOption: 0,
    options: [],
    postId: "",
    isNextPage: true,
    type: "",
    cursorEnd: null,
    timeoutId: null,
    fb_dtsg: null,
    status: "continue",
  });

  // ── State helpers ────────────────────────────────────────────────────────

  const updateState = useCallback((updates: Partial<ExportState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const getCount = useCallback((): number => {
    if (!textAreaRef.current) return 0;
    return textAreaRef.current.value.split("\n").filter(Boolean).length;
  }, [textAreaRef]);

  // ── Scraping control ─────────────────────────────────────────────────────

  const stopScan = useCallback(() => {
    if (cfg.current.timeoutId !== null) {
      clearTimeout(cfg.current.timeoutId);
      cfg.current.timeoutId = null;
    }
  }, []);

  const finishScan = useCallback(() => {
    updateState({ status: "stop", success: true });
    stopScan();
  }, [updateState, stopScan]);

  // ── Member accumulation ──────────────────────────────────────────────────

  const addMember = useCallback(
    (member: { id: string; name?: string; url?: string }) => {
      const { id, name, url } = member;

      // Entry without name — just store ID
      if (!name) {
        if (!id) return;
        setState((prev) => ({
          ...prev,
          arrUID: [{ uid: id }, ...prev.arrUID],
        }));
        if (textAreaRef.current) {
          textAreaRef.current.value = id + "\n" + textAreaRef.current.value;
        }
        return;
      }

      // Validate named entry
      const isInvalid = INVALID_NAMES.includes(name) || id.length > 16;
      if (isInvalid) return;

      setState((prev) => {
        if (prev.arrUID.some((item) => item.uid === id)) return prev;
        return { ...prev, arrUID: [{ uid: id, name, url }, ...prev.arrUID] };
      });

      if (textAreaRef.current) {
        textAreaRef.current.value =
          `${id}|${name}\n` + textAreaRef.current.value;
      }
    },
    [textAreaRef]
  );

  // ── Generic delayed AJAX helper ──────────────────────────────────────────

  /**
   * Clears any pending timeout, checks that the scan is still running,
   * then schedules an AJAX POST after REQUEST_DELAY_MS.
   */
  const scheduleAjax = useCallback(
    <T>(requestData: object, onSuccess: (data: T) => void): void => {
      stopScan();
      if (cfg.current.status !== "continue") return;

      cfg.current.timeoutId = setTimeout(() => {
        $.ajax({ type: "POST", url: FB_API_URL, data: requestData })
          .done((response: string) => {
            try {
              onSuccess(JSON.parse(response));
            } catch {
              stopScan();
            }
          })
          .fail(() => stopScan());
      }, REQUEST_DELAY_MS);
    },
    [stopScan]
  );

  // ── Forward-ref for getUidInPost (breaks circular deps) ─────────────────
  // getUidCommentInPost / Share / Reactors all need to call getUidInPost,
  // but getUidInPost depends on them. Using a stable ref breaks the cycle.
  const getUidInPostRef = useRef<
    (postId: string, option: string, cursor?: string | null) => void
  >(() => {});

  // ── Group members ────────────────────────────────────────────────────────

  const scanGroupMembers = useCallback(
    (cursor: string | null = null) => {
      const requestData = {
        av: userID,
        __user: userID,
        __a: 1,
        __dyn:
          "7AzHK4HwkEng5K8G6EjBAg2owIxu13wFwnUW3q2ibwNw9G2Saw8i2S1DwUx60GE3Qwb-q7oc81xoswMwto886C11wBz83WwtohwGxu782lwv89kbxS2218wc61awko5m1mzXw8W58jwGzEaE5e7oqBwJK2W5olwuEjUlDw-wUwxwjFovUaU3VBwFKq2-azo6O14wwwOg2cwMwhEkxebwHwNxe6Uak0zU8oC1Hg6C13whEeE4WVU-4Edouw",
        __csr:
          "l3A9gDkYIkxIlkl69W5lqJ8myhD4EiDbnSDaBlWiL9QGEjFbhti9j9kQCGjKrDT-jtd94y92ly4hGqEF2pq-h6Qp7WhGDy-dizpqRF2pFotAyU-fV4uppHUiLBG5obEWbDxbFwoqx2cBxaay8gxm3h38jzU5m3-2S8x6bwxwp8-i3i1zwFxG3e3S58bE98eU5i1Ewfmdwzw6KweC0a1w1Gq0d6w05mxw8S08ow3pE0GS0sC02tC5o0J-1MwdW0vC0dXCw13vyFGg0205w3K8y13BDgG05V8",
        __hsi: 0x660fcec73e49b800,
        __comet_req: 15,
        fb_dtsg: cfg.current.fb_dtsg,
        jazoest: 0x6417,
        lsd: "gev7cofpOqIHSoBfdhSxNR",
        fb_api_caller_class: "RelayModern",
        fb_api_req_friendly_name:
          "GroupsCometMembersPageNewMembersSectionRefetchQuery",
        variables: JSON.stringify({
          count: 10,
          cursor,
          groupID,
          scale: 1.5,
          id: groupID,
        }),
        doc_id: 0x199d031e73c95f,
      };

      scheduleAjax(requestData, (data: any) => {
        // Retry with same cursor if no node yet
        if (!data?.data?.node) {
          scanGroupMembers(cfg.current.cursorEnd);
          return;
        }
        const { edges, page_info } = data.data.node.new_members;
        cfg.current.isNextPage = page_info.has_next_page;
        cfg.current.cursorEnd = page_info.end_cursor;

        edges.forEach((m: any) =>
          addMember({ id: m.node.id, name: m.node.name, url: m.node.url })
        );
        updateState({ count: getCount() });

        if (page_info.has_next_page) {
          scanGroupMembers(page_info.end_cursor);
        } else {
          finishScan();
        }
      });
    },
    [userID, groupID, scheduleAjax, addMember, updateState, getCount, finishScan]
  );

  // ── Post comments ────────────────────────────────────────────────────────

  const scanPostComments = useCallback(
    (postId: string, cursor: string | null = null) => {
      const requestData = {
        ...buildBasePayload(userID, cfg.current.fb_dtsg),
        fb_api_caller_class: "RelayModern",
        fb_api_req_friendly_name: "CometUFICommentsProviderPaginationQuery",
        variables: JSON.stringify({
          after: cursor,
          before: null,
          displayCommentsFeedbackContext: null,
          displayCommentsContextEnableComment: null,
          displayCommentsContextIsAdPreview: null,
          displayCommentsContextIsAggregatedShare: null,
          displayCommentsContextIsStorySet: null,
          feedLocation: "NEWSFEED",
          feedbackID: btoa("feedback:" + postId),
          feedbackSource: 1,
          first: 10,
          focusCommentID: null,
          includeHighlightedComments: false,
          includeNestedComments: true,
          initialViewOption: "RANKED_THREADED",
          isInitialFetch: false,
          isPaginating: true,
          last: null,
          scale: 1,
          topLevelViewOption: null,
          useDefaultActor: false,
          viewOption: null,
          UFI2CommentsProvider_commentsKey: "CometModernHomeFeedQuery",
        }),
        doc_id: 0x142a50c63c43a1,
      };

      scheduleAjax(requestData, (data: any) => {
        const { edges, page_info } = data.data.feedback.display_comments;
        cfg.current.cursorEnd = page_info.end_cursor;
        cfg.current.isNextPage = page_info.has_next_page;

        if (!edges?.length) {
          getUidInPostRef.current(postId, cfg.current.options[++cfg.current.indexOption]);
          return;
        }

        edges.forEach((c: any) =>
          addMember({ id: c.node.author.id, name: c.node.author.name })
        );
        updateState({ count: getCount() });

        if (page_info.has_next_page) {
          scanPostComments(postId, page_info.end_cursor);
        } else {
          getUidInPostRef.current(postId, cfg.current.options[++cfg.current.indexOption]);
        }
      });
    },
    [userID, scheduleAjax, addMember, updateState, getCount]
  );

  // ── Post shares ──────────────────────────────────────────────────────────

  const scanPostShares = useCallback(
    (postId: string, cursor: string | null = null) => {
      const requestData = {
        ...buildBasePayload(userID, cfg.current.fb_dtsg),
        fb_api_caller_class: "RelayModern",
        fb_api_req_friendly_name: "CometResharesFeedPaginationQuery",
        variables: JSON.stringify({
          UFI2CommentsProvider_commentsKey: "CometResharesDialogQuery",
          count: 1,
          cursor,
          displayCommentsContextEnableComment: null,
          displayCommentsContextIsAdPreview: null,
          displayCommentsContextIsAggregatedShare: null,
          displayCommentsContextIsStorySet: null,
          displayCommentsFeedbackContext: null,
          feedLocation: "SHARE_OVERLAY",
          feedbackSource: 1,
          focusCommentID: null,
          privacySelectorRenderLocation: "COMET_STREAM",
          renderLocation: "reshares_dialog",
          scale: 1,
          useDefaultActor: false,
          id: btoa("feedback:" + postId),
        }),
        doc_id: 0xfd9b51ddbe49f,
      };

      scheduleAjax(requestData, (data: any) => {
        const { edges, page_info } = data.data.node.reshares;
        cfg.current.cursorEnd = page_info.end_cursor;
        cfg.current.isNextPage = page_info.has_next_page;

        if (!edges?.length) {
          getUidInPostRef.current(postId, cfg.current.options[++cfg.current.indexOption]);
          return;
        }

        edges.forEach((share: any) => {
          const actor =
            share.node.comet_sections.context_layout.story.comet_sections
              .title.story.actors[0];
          addMember({ id: actor.id, name: actor.name });
        });
        updateState({ count: getCount() });

        if (page_info.has_next_page) {
          scanPostShares(postId, page_info.end_cursor);
        } else {
          getUidInPostRef.current(postId, cfg.current.options[++cfg.current.indexOption]);
        }
      });
    },
    [userID, scheduleAjax, addMember, updateState, getCount]
  );

  // ── Post reactors ────────────────────────────────────────────────────────

  const scanPostReactors = useCallback(
    (postId: string, cursor: string | null = null) => {
      const feedbackId = btoa("feedback:" + postId);
      const requestData = {
        ...buildBasePayload(userID, cfg.current.fb_dtsg),
        fb_api_caller_class: "RelayModern",
        fb_api_req_friendly_name: "CometUFIReactionsDialogTabContentRefetchQuery",
        variables: JSON.stringify({
          count: 10,
          cursor,
          feedbackTargetID: feedbackId,
          reactionType: "NONE",
          scale: 1,
          id: feedbackId,
        }),
        doc_id: 0xe2cfe796cc080,
      };

      scheduleAjax(requestData, (data: any) => {
        const { edges, page_info } = data.data.node.reactors;
        cfg.current.cursorEnd = page_info.end_cursor;
        cfg.current.isNextPage = page_info.has_next_page;

        if (!edges?.length) {
          getUidInPostRef.current(postId, cfg.current.options[++cfg.current.indexOption]);
          return;
        }

        edges.forEach((r: any) =>
          addMember({ id: r.node.id, name: r.node.name })
        );
        updateState({ count: getCount() });

        if (page_info.has_next_page) {
          scanPostReactors(postId, page_info.end_cursor);
        } else {
          getUidInPostRef.current(postId, cfg.current.options[++cfg.current.indexOption]);
        }
      });
    },
    [userID, scheduleAjax, addMember, updateState, getCount]
  );

  // ── Post dispatcher ──────────────────────────────────────────────────────

  const dispatchPostScan = useCallback(
    (postId: string, option: string, cursor: string | null = null) => {
      switch (option) {
        case "comment":
          scanPostComments(postId, cursor);
          break;
        case "like":
          scanPostReactors(postId, cursor);
          break;
        case "share":
          scanPostShares(postId, cursor);
          break;
        default:
          finishScan();
      }
    },
    [scanPostComments, scanPostReactors, scanPostShares, finishScan]
  );

  // Keep ref up-to-date so the sub-scanners can call it without circular deps
  useEffect(() => {
    getUidInPostRef.current = dispatchPostScan;
  }, [dispatchPostScan]);

  // ── Post URL resolver ────────────────────────────────────────────────────

  const resolveAndScanPost = useCallback(async () => {
    const url = window.location.href;
    if (isEncodedPostId(url)) {
      const response = await getUserID(url);
      if (response.status === 200) {
        cfg.current.postId = response.data;
        dispatchPostScan(
          response.data,
          cfg.current.options[cfg.current.indexOption],
          cfg.current.cursorEnd
        );
      } else {
        alert("Thao tác quá nhanh, vui lòng thử lại sau 5 giây");
        stopScan();
      }
    } else {
      const postId = getIdFromUrl(url);
      cfg.current.postId = postId;
      dispatchPostScan(
        postId,
        cfg.current.options[cfg.current.indexOption],
        cfg.current.cursorEnd
      );
    }
  }, [dispatchPostScan, stopScan]);

  // ── Type router ──────────────────────────────────────────────────────────

  const routeScan = useCallback(
    (type: string, cursor: string | null = null) => {
      switch (type) {
        case "group":
          scanGroupMembers(cursor);
          break;
        case "post":
          if (cursor) {
            dispatchPostScan(
              cfg.current.postId,
              cfg.current.options[cfg.current.indexOption],
              cursor
            );
          } else {
            resolveAndScanPost();
          }
          break;
      }
    },
    [scanGroupMembers, dispatchPostScan, resolveAndScanPost]
  );

  // ── Public controls ──────────────────────────────────────────────────────

  const handleStop = useCallback(() => {
    cfg.current.status = "stop";
    updateState({ status: "stop" });
    stopScan();
  }, [updateState, stopScan]);

  const handleContinue = useCallback(() => {
    cfg.current.status = "continue";
    updateState({ status: "continue" });

    const { isNextPage, options, indexOption } = cfg.current;
    if (!isNextPage && !options[indexOption]) {
      finishScan();
      return;
    }
    routeScan(cfg.current.type, cfg.current.cursorEnd);
  }, [updateState, finishScan, routeScan]);

  const handleClose = useCallback(() => {
    cfg.current.status = "stop";
    updateState({ isLayoutExportUid: false, status: "stop" });
    removeCacheStorage();
    stopScan();
  }, [updateState, stopScan]);

  // ── Initialisation ───────────────────────────────────────────────────────

  const startScan = useCallback(
    (actionType: string) => {
      if (!cfg.current.fb_dtsg) {
        chrome.runtime.sendMessage(
          { action: "FB_DTSG", c_user: userID },
          (token: string | null) => {
            if (token) {
              cfg.current.fb_dtsg = token;
              window.localStorage.setItem("fb_dtsg", JSON.stringify(token));
              routeScan(actionType);
            }
          }
        );
        return;
      }
      routeScan(actionType);
    },
    [userID, routeScan]
  );

  useEffect(() => {
    chrome.storage.local.get(["data"], (storageData) => {
      if (storageData.data?.active) {
        cfg.current.options = storageData.data.options ?? [];
        cfg.current.type = storageData.data.type;
        updateState({ isLayoutExportUid: true });
        startScan(storageData.data.type);
        removeCacheStorage();
      }
    });
    // Run once on mount; deps intentionally excluded
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    state,
    handleStop,
    handleContinue,
    handleClose,
  };
};
