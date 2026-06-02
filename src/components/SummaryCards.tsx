import React from 'react'
import { formatRupiah } from '../lib/utils'
import { Landmark, ArrowLeftRight, Percent } from 'lucide-react'

interface SummaryCardsProps {
  totalTransactions: number
  totalVolume: number
  totalAdmin: number
}

const SummaryCards: React.FC<SummaryCardsProps> = ({
  totalTransactions,
  totalVolume,
  totalAdmin
}) => {
  const cards = [
    {
      title: 'JUMLAH TRANSAKSI',
      value: `${totalTransactions} Trx`,
      subtext: 'Total hari ini',
      color: 'blue',
      icon: ArrowLeftRight,
      bgClass: 'bg-indigo-50 border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400',
      iconClass: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/55 dark:text-indigo-400'
    },
    {
      title: 'VOLUME PENJUALAN',
      value: formatRupiah(totalVolume),
      subtext: 'Peredaran uang',
      color: 'emerald',
      icon: Landmark,
      bgClass: 'bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400',
      iconClass: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/55 dark:text-emerald-400'
    },
    {
      title: 'ADMIN FEE (LABA)',
      value: formatRupiah(totalAdmin),
      subtext: 'Keuntungan bersih',
      color: 'amber',
      icon: Percent,
      bgClass: 'bg-amber-50 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30 text-amber-600 dark:text-amber-400',
      iconClass: 'bg-amber-100 text-amber-600 dark:bg-amber-950/55 dark:text-amber-400'
    }
  ]

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {cards.map((card, i) => {
        const Icon = card.icon
        return (
          <div 
            key={i}
            className={`border rounded-[1.125rem] p-3 sm:p-4 flex flex-col transition-all duration-300 shadow-sm hover:shadow-md relative overflow-hidden ${card.bgClass}`}
          >
            <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-black/5 mb-2.5 ${card.iconClass}`}>
              <Icon size={14} className="sm:hidden" />
              <Icon size={18} className="hidden sm:block" />
            </div>
            
            <div className="min-w-0 z-10 w-full mt-auto">
              <p className="text-[8px] font-black tracking-widest text-slate-500/80 uppercase leading-[1.2] mb-1 sm:mb-1.5 line-clamp-2 h-auto">
                {card.title.replace('JUMLAH TRANSAKSI', 'TRX').replace('VOLUME PENJUALAN', 'VOLUME').replace('ADMIN FEE (LABA)', 'LABA')}
              </p>
              <h4 className="text-[12px] sm:text-sm font-black tracking-tight truncate leading-none">
                {card.value}
              </h4>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default SummaryCards
