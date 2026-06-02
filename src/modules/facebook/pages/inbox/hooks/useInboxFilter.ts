import { useCallback, useEffect } from 'react'
import { applyFilter, computeFilterStats } from '../utils/inbox-filter.util'
import useInboxStore from '../store/inbox.store'
import { IInboxFilter } from '../types/inbox.interface'

export function useInboxFilter() {
  const {
    campaign,
    setFilter,
    resetFilter,
    setFilterStats,
    setFilteredCustomers,
  } = useInboxStore()

  const { customers, filters, filterStats, filteredCount, filteredPercent, filteredCustomers, category } = campaign

  // Recompute filtered list whenever customers or filters change
  useEffect(() => {
    if (customers.length === 0) return

    const stats = computeFilterStats(customers, category)
    setFilterStats(stats)

    const filtered = applyFilter(customers, filters)
    const percent = customers.length > 0 ? Math.round((filtered.length / customers.length) * 100) : 0
    setFilteredCustomers(filtered, filtered.length, percent)
  }, [customers, filters, category, setFilterStats, setFilteredCustomers])

  const updateFilter = useCallback(
    (partial: Partial<IInboxFilter>) => {
      setFilter(partial)
    },
    [setFilter]
  )

  const clearFilter = useCallback(() => {
    resetFilter()
  }, [resetFilter])

  return {
    filters,
    filterStats,
    filteredCount,
    filteredPercent,
    filteredCustomers,
    totalCustomers: customers.length,
    updateFilter,
    clearFilter,
  }
}

export default useInboxFilter
