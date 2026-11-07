import { exportToCSV } from "src/utils/export.util";
import { normalizeForSearch } from "src/configs/tools.config"
import { Clock, Download, ExternalLink, LogOut, RotateCw, Search, ShieldAlert, Square, UserMinus, Users, XCircle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { TableFacebookPagination } from 'src/modules/facebook/components/TablePagination';
import { runFacebookBulkAction } from 'src/modules/facebook/utils/bulk-action.util';
import { useTranslation } from 'react-i18next';
import type { BulkState } from 'src/modules/facebook/types/bulk.types';
import { useFacebook } from 'src/modules/facebook/hooks/useFacebookSession';
import { Badge, Button, Callout, Checkbox, cn, ConfirmDialog, IconButton, Input, Segmented, Select, Spinner } from 'src/modules/shared/ui';

import { useGroups } from 'src/modules/account/hooks/useGroups';
import { usePendingGroups } from 'src/modules/account/hooks/usePendingGroups';
import { JoinedGroup, PendingGroup } from 'src/modules/account/types/groups.types';

type GroupsBulkState = BulkState<'leave' | 'cancel'>;
type ActivityFilterType = 'all' | 'active' | 'low_active' | 'inactive' | 'never';

type TFunction = (key: string, params?: Record<string, string | number>) => string;

function formatLastVisited(timestamp: number | null, t: TFunction): string {
    if (!timestamp || timestamp === 0) return t('groups_panel_last_visited_never');
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    if (diff < 0) return t('groups_panel_last_visited_just_now');
    const days = Math.floor(diff / 86400);
    if (days < 1) return t('groups_panel_last_visited_today');
    if (days < 30) return t('groups_panel_last_visited_days_ago', { count: days });
    const months = Math.floor(days / 30);
    if (months < 12) return t('groups_panel_last_visited_months_ago', { count: months });
    const years = Math.floor(months / 12);
    return t('groups_panel_last_visited_years_ago', { count: years });
}

const fallbackAvatar = (name: string) => `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;

function GroupCell({ name, url, uid, avatar }: { name: string; url: string; uid: string; avatar: string }) {
    return (
        <div className="bm-flex bm-items-center bm-gap-2">
            <img
                src={avatar || fallbackAvatar(name)}
                alt={name}
                className="bm-h-8 bm-w-8 bm-shrink-0 bm-rounded-md bm-border bm-border-line bm-bg-surface-2 bm-object-cover"
                onError={(e) => {
                    (e.target as HTMLImageElement).src = fallbackAvatar(name);
                }}
            />
            <div className="bm-flex bm-min-w-0 bm-flex-col">
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bm-line-clamp-2 bm-break-words bm-font-semibold bm-text-brand-ink hover:bm-underline"
                >
                    {name}
                </a>
                <span className="bm-mt-0.5 bm-font-mono bm-text-[10px] bm-tracking-tight bm-text-fg-subtle">{uid}</span>
            </div>
        </div>
    );
}

export function GroupsPanel() {
    const { t } = useTranslation();
    const { profile } = useFacebook();
    const [activeTab, setActiveTab] = useState<'joined' | 'pending'>('joined');

    // Joined groups hooks and states
    const { state: joinedState, groups: apiGroups, load: loadJoined, leaveGroup } = useGroups();
    const [localJoinedGroups, setLocalJoinedGroups] = useState<JoinedGroup[]>([]);
    const [leftGroupIds, setLeftGroupIds] = useState<Set<string>>(new Set());
    const [leavingGroupIds, setLeavingGroupIds] = useState<Set<string>>(new Set());

    // Pending groups hooks and states
    const { state: pendingState, pendingGroups: apiPendingGroups, load: loadPending, cancelRequest } = usePendingGroups();
    const [localPendingGroups, setLocalPendingGroups] = useState<PendingGroup[]>([]);
    const [canceledGroupIds, setCanceledGroupIds] = useState<Set<string>>(new Set());
    const [cancelingGroupIds, setCancelingGroupIds] = useState<Set<string>>(new Set());

    // UI state
    const [searchQuery, setSearchQuery] = useState('');
    const [activityFilter, setActivityFilter] = useState<ActivityFilterType>('all');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Bulk state
    const bulkStopRef = useRef(false);
    const [bulkRunning, setBulkRunning] = useState<GroupsBulkState | null>(null);

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [confirmTarget, setConfirmTarget] = useState<{ id: string; name: string } | null>(null);
    const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);

    // Load data based on active tab
    useEffect(() => {
        if (profile?.uid) {
            if (activeTab === 'joined') {
                loadJoined({ cursor: null, accumulate: false, forceRefresh: false });
            } else {
                loadPending({ cursor: null, accumulate: false, forceRefresh: false });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile?.uid, activeTab]);

    // Update local lists when API loads data
    useEffect(() => {
        if (apiGroups && apiGroups.length > 0) {
            setLocalJoinedGroups(apiGroups);
        }
    }, [apiGroups]);

    useEffect(() => {
        if (apiPendingGroups) {
            setLocalPendingGroups(apiPendingGroups);
        }
    }, [apiPendingGroups]);

    // Reset pagination and selections on tab change
    useEffect(() => {
        setCurrentPage(1);
        setSearchQuery('');
        setSelectedIds(new Set());
    }, [activeTab]);

    // Handle reload
    const handleReload = () => {
        if (activeTab === 'joined') {
            loadJoined({ cursor: null, accumulate: false, forceRefresh: true });
            setLeftGroupIds(new Set());
        } else {
            loadPending({ cursor: null, accumulate: false, forceRefresh: true });
            setCanceledGroupIds(new Set());
        }
        setSelectedIds(new Set());
    };

    // Filtered lists
    const filteredJoinedGroups = useMemo(() => {
        const query = normalizeForSearch(searchQuery);
        return localJoinedGroups.filter((group) => {
            const matchesSearch = normalizeForSearch(group.name).includes(query) || group.uid.includes(query);
            if (!matchesSearch) return false;

            if (activityFilter === 'all') return true;

            const lastVisited = group.lastVisitedTime;
            if (activityFilter === 'never') {
                return lastVisited === null || lastVisited === 0;
            }

            if (!lastVisited) return false;

            const now = Math.floor(Date.now() / 1000);
            const diffDays = (now - lastVisited) / 86400;

            if (activityFilter === 'active') {
                return diffDays < 30;
            }
            if (activityFilter === 'low_active') {
                return diffDays >= 30 && diffDays <= 90;
            }
            if (activityFilter === 'inactive') {
                return diffDays > 90;
            }

            return true;
        });
    }, [localJoinedGroups, searchQuery, activityFilter]);

    const filteredPendingGroups = useMemo(() => {
        const query = normalizeForSearch(searchQuery);
        return localPendingGroups.filter((group) => {
            return normalizeForSearch(group.name).includes(query) || group.uid.includes(query);
        });
    }, [localPendingGroups, searchQuery]);

    const currentFilteredList: (JoinedGroup | PendingGroup)[] = activeTab === 'joined' ? filteredJoinedGroups : filteredPendingGroups;

    // Pagination
    const paginatedItems = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return currentFilteredList.slice(startIndex, startIndex + pageSize);
    }, [currentFilteredList, currentPage, pageSize]);

    const totalPages = Math.ceil(currentFilteredList.length / pageSize);

    // Reset page when search query or filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, activityFilter, pageSize]);

    const processedIds = activeTab === 'joined' ? leftGroupIds : canceledGroupIds;

    // Selection handlers
    const toggleSelectAll = () => {
        const selectable = paginatedItems.filter((g) => !processedIds.has(g.id));

        const allSelected = selectable.length > 0 && selectable.every((g) => selectedIds.has(g.id));

        const newSelection = new Set(selectedIds);
        if (allSelected) {
            selectable.forEach((g) => newSelection.delete(g.id));
        } else {
            selectable.forEach((g) => newSelection.add(g.id));
        }
        setSelectedIds(newSelection);
    };

    const toggleSelectOne = (id: string) => {
        const newSelection = new Set(selectedIds);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        setSelectedIds(newSelection);
    };

    const handleActionClick = (id: string, name: string) => {
        setConfirmTarget({ id, name });
        setIsConfirmOpen(true);
    };

    const handleActionConfirm = async () => {
        if (!confirmTarget) return;
        const { id, name } = confirmTarget;

        if (activeTab === 'joined') {
            setLeavingGroupIds((prev) => new Set(prev).add(id));
            const success = await leaveGroup(id);
            setLeavingGroupIds((prev) => {
                const s = new Set(prev);
                s.delete(id);
                return s;
            });
            if (success) {
                setLeftGroupIds((prev) => new Set(prev).add(id));
                toast.success(t('groups_panel_toast_leave_success', { name }));
            } else {
                toast.error(t('groups_panel_toast_leave_fail', { name }));
            }
        } else {
            setCancelingGroupIds((prev) => new Set(prev).add(id));
            const success = await cancelRequest(id);
            setCancelingGroupIds((prev) => {
                const s = new Set(prev);
                s.delete(id);
                return s;
            });
            if (success) {
                setCanceledGroupIds((prev) => new Set(prev).add(id));
                toast.success(t('groups_panel_toast_cancel_success', { name }));
            } else {
                toast.error(t('groups_panel_toast_cancel_fail', { name }));
            }
        }
    };

    // Bulk actions target list
    const bulkTargets = useMemo(() => {
        const processed = activeTab === 'joined' ? leftGroupIds : canceledGroupIds;
        return Array.from(selectedIds).filter((id) => !processed.has(id));
    }, [selectedIds, leftGroupIds, canceledGroupIds, activeTab]);

    const handleBulkActionClick = () => {
        if (bulkTargets.length === 0) return;
        setIsBulkConfirmOpen(true);
    };

    const handleBulkActionConfirm = async () => {
        const targets = bulkTargets;
        if (targets.length === 0) return;

        await runFacebookBulkAction({
            targets,
            actionType: activeTab === 'joined' ? 'leave' : 'cancel',
            bulkStopRef,
            setBulkRunning,
            executeSingle: async (id) => {
                if (activeTab === 'joined') {
                    setLeavingGroupIds((prev) => new Set(prev).add(id));
                    const ok = await leaveGroup(id);
                    setLeavingGroupIds((prev) => {
                        const s = new Set(prev);
                        s.delete(id);
                        return s;
                    });
                    if (ok) {
                        setLeftGroupIds((prev) => new Set(prev).add(id));
                        return true;
                    }
                } else {
                    setCancelingGroupIds((prev) => new Set(prev).add(id));
                    const ok = await cancelRequest(id);
                    setCancelingGroupIds((prev) => {
                        const s = new Set(prev);
                        s.delete(id);
                        return s;
                    });
                    if (ok) {
                        setCanceledGroupIds((prev) => new Set(prev).add(id));
                        return true;
                    }
                }
                return false;
            },
            onFinished: (success, fail) => {
                toast.success(t('groups_panel_toast_bulk_finished', { success, fail }));
            },
        });
    };

    const stopBulk = () => {
        bulkStopRef.current = true;
    };

    // CSV Export
    const handleExport = () => {
        const sourceList: (JoinedGroup | PendingGroup)[] = activeTab === 'joined' ? localJoinedGroups : localPendingGroups;
        const listToExport = selectedIds.size > 0 ? sourceList.filter((g) => selectedIds.has(g.id)) : sourceList;

        if (listToExport.length === 0) {
            toast.error(t('groups_panel_toast_export_no_data'));
            return;
        }

        const headers =
            activeTab === 'joined'
                ? [
                      t('groups_panel_csv_header_no'),
                      t('groups_panel_csv_header_group_id'),
                      t('groups_panel_csv_header_group_name'),
                      t('groups_panel_csv_header_last_activity'),
                      t('groups_panel_csv_header_status'),
                  ]
                : [
                      t('groups_panel_csv_header_no'),
                      t('groups_panel_csv_header_group_id'),
                      t('groups_panel_csv_header_group_name'),
                      t('groups_panel_csv_header_recent_activity'),
                      t('groups_panel_csv_header_status'),
                  ];

        const csvRows = listToExport.map((g, idx) => {
            if (activeTab === 'joined') {
                const jg = g as JoinedGroup;
                return [
                    idx + 1,
                    jg.uid,
                    jg.name,
                    formatLastVisited(jg.lastVisitedTime, t),
                    leftGroupIds.has(jg.id) ? t('groups_panel_status_left') : jg.status,
                ];
            } else {
                const pg = g as PendingGroup;
                return [
                    idx + 1,
                    pg.uid,
                    pg.name,
                    pg.lastPostTime ? formatLastVisited(pg.lastPostTime, t) : t('groups_panel_no_activity'),
                    canceledGroupIds.has(pg.id) ? t('groups_panel_status_canceled') : pg.status,
                ];
            }
        });

        exportToCSV(headers, csvRows, `${activeTab === 'joined' ? 'danh_sach_nhom_da_tham_gia' : 'danh_sach_yeu_cau_cho_duyet'}_${Date.now()}.csv`);
        toast.success(t('groups_panel_toast_export_success', { count: listToExport.length }));
    };

    const currentState = activeTab === 'joined' ? joinedState : pendingState;

    const selectablePageItems = paginatedItems.filter((g) => !processedIds.has(g.id));
    const allPageSelected = paginatedItems.length > 0 && selectablePageItems.every((g) => selectedIds.has(g.id));

    const thClass = 'bm-px-2 bm-py-2 bm-text-left bm-text-[10.5px] bm-font-semibold bm-uppercase bm-tracking-wider bm-text-fg-muted';
    const tdClass = 'bm-px-2 bm-py-2 bm-align-middle';

    return (
        <div className="bm-flex bm-w-full bm-flex-col bm-gap-3 bm-rounded-xl bm-border bm-border-line bm-bg-surface bm-p-3 bm-text-fg">
            {/* Header Tabs */}
            <div className="bm-flex bm-flex-wrap bm-items-center bm-justify-between bm-gap-2 bm-border-b bm-border-line bm-pb-2">
                <div className="bm-flex bm-items-center bm-gap-2">
                    <h2 className="bm-text-[14px] bm-font-bold bm-tracking-wide">{t('groups_panel_heading')}</h2>
                    <Badge tone="success">
                        {activeTab === 'joined'
                            ? t('groups_panel_badge_joined_count', { count: localJoinedGroups.length })
                            : t('groups_panel_badge_pending_count', { count: localPendingGroups.length })}
                    </Badge>
                </div>

                <Segmented<'joined' | 'pending'>
                    size="sm"
                    block
                    value={activeTab}
                    onChange={setActiveTab}
                    options={[
                        { value: 'joined', label: t('groups_panel_tab_joined'), icon: <Users size={13} /> },
                        { value: 'pending', label: t('groups_panel_tab_pending'), icon: <Clock size={13} /> },
                    ]}
                />
            </div>

            {/* Warnings */}
            {activeTab === 'joined' ? (
                <Callout tone="warning" icon={<ShieldAlert size={16} />}>
                    {t('groups_panel_warning_joined_prefix')} <strong>{t('groups_panel_warning_joined_inactive')}</strong>{' '}
                    {t('groups_panel_warning_joined_or')} <strong>{t('groups_panel_warning_joined_never')}</strong>{' '}
                    {t('groups_panel_warning_joined_suffix')}
                </Callout>
            ) : (
                <Callout tone="info" icon={<ShieldAlert size={16} />}>
                    {t('groups_panel_warning_pending')}
                </Callout>
            )}

            {/* Toolbar */}
            <div className="bm-flex bm-flex-col bm-gap-2 bm-rounded-lg bm-border bm-border-line bm-bg-surface-2/50 bm-p-2.5">
                <div className="bm-flex bm-flex-wrap bm-items-center bm-gap-2">
                    {/* Search */}
                    <Input
                        size="sm"
                        type="text"
                        className="bm-min-w-[160px] bm-flex-1"
                        placeholder={
                            activeTab === 'joined'
                                ? t('groups_panel_search_placeholder_joined')
                                : t('groups_panel_search_placeholder_pending')
                        }
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        suffix={<Search size={14} className="bm-text-fg-subtle" />}
                    />

                    {/* Filter Activity (Joined tab only) */}
                    {activeTab === 'joined' && (
                        <Select<ActivityFilterType>
                            size="sm"
                            className="bm-min-w-[150px] bm-flex-1"
                            value={activityFilter}
                            onChange={setActivityFilter}
                            placeholder={t('groups_panel_filter_activity_placeholder')}
                            options={[
                                { value: 'all', label: t('groups_panel_filter_all_time') },
                                { value: 'active', label: t('groups_panel_filter_active') },
                                { value: 'low_active', label: t('groups_panel_filter_low_active') },
                                { value: 'inactive', label: t('groups_panel_filter_inactive') },
                                { value: 'never', label: t('groups_panel_filter_never') },
                            ]}
                        />
                    )}
                </div>

                <div className="bm-flex bm-flex-wrap bm-items-center bm-gap-2">
                    {/* Reload */}
                    <Button
                        size="xs"
                        variant="primary"
                        onClick={handleReload}
                        disabled={currentState === 'loading' || !!bulkRunning}
                        icon={<RotateCw size={13} className={cn(currentState === 'loading' && 'bm-animate-spin')} />}
                    >
                        {t('groups_panel_button_reload')}
                    </Button>

                    {/* Export CSV */}
                    <Button size="xs" variant="success" onClick={handleExport} disabled={!!bulkRunning} icon={<Download size={13} />}>
                        {t('groups_panel_button_export')} ({selectedIds.size > 0 ? selectedIds.size : currentFilteredList.length})
                    </Button>

                    {/* Bulk Action */}
                    {bulkTargets.length > 0 && !bulkRunning && (
                        <Button size="xs" variant="danger" onClick={handleBulkActionClick} icon={<LogOut size={13} />}>
                            {activeTab === 'joined'
                                ? t('groups_panel_button_bulk_leave', { count: bulkTargets.length })
                                : t('groups_panel_button_bulk_cancel', { count: bulkTargets.length })}
                        </Button>
                    )}

                    {/* Secondary Actions */}
                    <IconButton tooltip={activeTab === 'joined' ? t('groups_panel_tooltip_open_groups') : t('groups_panel_tooltip_open_sent_requests')}
                            size="xs"
                            variant="outline"
                            label={
                                activeTab === 'joined'
                                    ? t('groups_panel_tooltip_open_groups')
                                    : t('groups_panel_tooltip_open_sent_requests')
                            }
                            onClick={() =>
                                window.open(activeTab === 'joined' ? 'https://facebook.com/groups/feed/' : 'https://facebook.com/groups/joins/', '_blank')
                            }
                        >
                            <ExternalLink size={13} />
                        </IconButton>
                </div>

                {/* Bulk progress indicator */}
                {bulkRunning && (
                    <div className="bm-flex bm-flex-wrap bm-items-center bm-gap-2 bm-rounded-md bm-border bm-border-line bm-bg-surface bm-px-2.5 bm-py-1 bm-text-[12px] bm-text-fg-muted">
                        <Spinner size={13} className="bm-text-brand" />
                        <span className="bm-font-medium">
                            {activeTab === 'joined' ? t('groups_panel_bulk_progress_leaving') : t('groups_panel_bulk_progress_canceling')}
                        </span>
                        <span className="bm-font-mono">
                            {bulkRunning.current}/{bulkRunning.total}
                        </span>
                        <span className="bm-font-medium bm-text-success">✓{bulkRunning.success}</span>
                        {bulkRunning.fail > 0 && <span className="bm-font-medium bm-text-danger">✗{bulkRunning.fail}</span>}
                        <IconButton
                            size="xs"
                            variant="ghost"
                            label={t('groups_panel_button_stop')}
                            onClick={stopBulk}
                            className="bm-ml-auto hover:bm-bg-danger-soft hover:bm-text-danger"
                        >
                            <Square size={12} />
                        </IconButton>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="bm-overflow-x-auto bm-rounded-lg bm-border bm-border-line bm-bg-surface">
                <table className="bm-w-full bm-border-collapse bm-text-[12px]">
                    <thead className="bm-select-none bm-bg-surface-2">
                        <tr className="bm-border-b bm-border-line">
                            <th className={cn(thClass, 'bm-w-8 bm-text-center')}>
                                <Checkbox size="sm" checked={allPageSelected} onChange={toggleSelectAll} />
                            </th>
                            <th className={cn(thClass, 'bm-w-8 bm-text-center')}>#</th>
                            <th className={cn(thClass, 'bm-min-w-[150px]')}>{t('groups_panel_col_group')}</th>
                            <th className={cn(thClass, 'bm-min-w-[80px]')}>
                                {activeTab === 'joined' ? t('groups_panel_col_last_visited') : t('groups_panel_col_recent_activity')}
                            </th>
                            <th className={thClass}>{t('groups_panel_col_status')}</th>
                            <th className={cn(thClass, 'bm-text-center')}>{t('groups_panel_col_action')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedItems.length > 0 ? (
                            paginatedItems.map((item, index) => {
                                const globalIndex = (currentPage - 1) * pageSize + index + 1;
                                const isSelected = selectedIds.has(item.id);
                                const rowClass = cn(
                                    'bm-border-b bm-border-line/60 bm-transition-colors hover:bm-bg-surface-2/60',
                                    isSelected && 'bm-bg-brand-soft/40 hover:bm-bg-brand-soft/60',
                                );

                                if (activeTab === 'joined') {
                                    const group = item as JoinedGroup;
                                    const isLeft = leftGroupIds.has(group.id);
                                    const isLeaving = leavingGroupIds.has(group.id);
                                    const isStale =
                                        !group.lastVisitedTime || (Math.floor(Date.now() / 1000) - group.lastVisitedTime) / 86400 > 90;
                                    return (
                                        <tr key={group.id} className={rowClass}>
                                            <td className={cn(tdClass, 'bm-text-center')}>
                                                <Checkbox size="sm" checked={isSelected} onChange={() => toggleSelectOne(group.id)} disabled={isLeft} />
                                            </td>
                                            <td className={cn(tdClass, 'bm-text-center bm-font-mono bm-text-fg-subtle')}>{globalIndex}</td>
                                            <td className={tdClass}>
                                                <GroupCell name={group.name} url={group.url} uid={group.uid} avatar={group.avatar} />
                                            </td>
                                            <td className={tdClass}>
                                                <span className={cn('bm-font-medium', isStale ? 'bm-text-danger' : 'bm-text-fg-muted')}>
                                                    {formatLastVisited(group.lastVisitedTime, t)}
                                                </span>
                                            </td>
                                            <td className={tdClass}>
                                                <Badge size="xs" tone={isLeft ? 'neutral' : 'success'}>
                                                    {isLeft ? t('groups_panel_status_left') : group.status}
                                                </Badge>
                                            </td>
                                            <td className={cn(tdClass, 'bm-text-center')}>
                                                <IconButton
                                                    size="xs"
                                                    variant="outline"
                                                    label={isLeft ? t('groups_panel_status_left') : t('groups_panel_action_leave')}
                                                    onClick={() => handleActionClick(group.id, group.name)}
                                                    disabled={isLeft || isLeaving}
                                                    className={cn(
                                                        isLeft
                                                            ? 'bm-cursor-default bm-text-fg-subtle'
                                                            : 'bm-border-danger/30 bm-bg-danger-soft bm-text-danger hover:bm-bg-danger-soft',
                                                    )}
                                                >
                                                    {isLeaving ? <Spinner size={13} /> : <LogOut size={13} className={cn(isLeft && 'bm-opacity-40')} />}
                                                </IconButton>
                                            </td>
                                        </tr>
                                    );
                                } else {
                                    const group = item as PendingGroup;
                                    const isCanceled = canceledGroupIds.has(group.id);
                                    const isCanceling = cancelingGroupIds.has(group.id);
                                    return (
                                        <tr key={group.id} className={rowClass}>
                                            <td className={cn(tdClass, 'bm-text-center')}>
                                                <Checkbox
                                                    size="sm"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelectOne(group.id)}
                                                    disabled={isCanceled}
                                                />
                                            </td>
                                            <td className={cn(tdClass, 'bm-text-center bm-font-mono bm-text-fg-subtle')}>{globalIndex}</td>
                                            <td className={tdClass}>
                                                <GroupCell name={group.name} url={group.url} uid={group.uid} avatar={group.avatar} />
                                            </td>
                                            <td className={cn(tdClass, 'bm-text-fg-muted')}>
                                                {group.lastPostTime ? (
                                                    <span className="bm-flex bm-items-center bm-gap-1 bm-text-fg">
                                                        <Clock size={11} className="bm-shrink-0 bm-text-fg-subtle" />
                                                        {formatLastVisited(group.lastPostTime, t)}
                                                    </span>
                                                ) : (
                                                    t('groups_panel_no_activity')
                                                )}
                                            </td>
                                            <td className={tdClass}>
                                                <Badge size="xs" tone={isCanceled ? 'neutral' : 'warning'}>
                                                    {isCanceled ? t('groups_panel_status_canceled') : group.status}
                                                </Badge>
                                            </td>
                                            <td className={cn(tdClass, 'bm-text-center')}>
                                                <IconButton
                                                    size="xs"
                                                    variant="outline"
                                                    label={isCanceled ? t('groups_panel_status_canceled') : t('groups_panel_action_cancel')}
                                                    onClick={() => handleActionClick(group.id, group.name)}
                                                    disabled={isCanceled || isCanceling}
                                                    className={cn(
                                                        isCanceled
                                                            ? 'bm-cursor-default bm-text-fg-subtle'
                                                            : 'bm-border-danger/30 bm-bg-danger-soft bm-text-danger hover:bm-bg-danger-soft',
                                                    )}
                                                >
                                                    {isCanceling ? (
                                                        <Spinner size={13} />
                                                    ) : isCanceled ? (
                                                        <XCircle size={13} className="bm-opacity-40" />
                                                    ) : (
                                                        <UserMinus size={13} />
                                                    )}
                                                </IconButton>
                                            </td>
                                        </tr>
                                    );
                                }
                            })
                        ) : (
                            <tr>
                                <td colSpan={6} className="bm-p-8 bm-text-center bm-italic bm-text-fg-muted">
                                    {currentState === 'loading' ? (
                                        <span className="bm-flex bm-items-center bm-justify-center bm-gap-2">
                                            <Spinner size={14} className="bm-text-brand" />
                                            {activeTab === 'joined' ? t('groups_panel_loading_joined') : t('groups_panel_loading_pending')}
                                        </span>
                                    ) : (
                                        t('groups_panel_no_matching_groups')
                                    )}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <TableFacebookPagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={currentFilteredList.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
            />

            <ConfirmDialog
                open={isConfirmOpen}
                onOpenChange={setIsConfirmOpen}
                onConfirm={handleActionConfirm}
                destructive
                title={activeTab === 'joined' ? t('groups_panel_confirm_leave_title') : t('groups_panel_confirm_cancel_title')}
                description={
                    confirmTarget
                        ? activeTab === 'joined'
                            ? t('groups_panel_confirm_leave_description', { name: confirmTarget.name })
                            : t('groups_panel_confirm_cancel_description', { name: confirmTarget.name })
                        : ''
                }
                confirmText={activeTab === 'joined' ? t('groups_panel_action_leave') : t('groups_panel_action_cancel')}
            />

            <ConfirmDialog
                open={isBulkConfirmOpen}
                onOpenChange={setIsBulkConfirmOpen}
                onConfirm={handleBulkActionConfirm}
                destructive
                title={activeTab === 'joined' ? t('groups_panel_confirm_bulk_leave_title') : t('groups_panel_confirm_bulk_cancel_title')}
                description={
                    activeTab === 'joined'
                        ? t('groups_panel_confirm_bulk_leave_description', { count: bulkTargets.length })
                        : t('groups_panel_confirm_bulk_cancel_description', { count: bulkTargets.length })
                }
                confirmText={activeTab === 'joined' ? t('groups_panel_button_bulk_leave_all') : t('groups_panel_button_bulk_cancel_all')}
            />
        </div>
    );
}
