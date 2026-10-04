import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, Filter, RefreshCw, Layers } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/utils'
import { RevealText, AnimatedCard, Toasts } from '../components/animations/Motion'
import { useToast } from '../hooks/useToast'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

export default function Laporan() {
  const { toasts, toast, dismiss } = useToast()
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate,   setEndDate]   = useState('')
  const [reportType, setReportType] = useState('PST') // 'PST' or 'PPID'

  useEffect(() => {
    const today = new Date().toISOString().slice(0,10)
    const first = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10)
    setStartDate(first)
    setEndDate(today)
  }, [])

  useEffect(() => { if (startDate && endDate) fetchData() }, [startDate, endDate, reportType])

  const fetchData = async () => {
    setLoading(true)
    const tableName = reportType === 'PST' ? 'buku_tamu' : 'ppid_permohonan'
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .gte('waktu_masuk', startDate + 'T00:00:00')
      .lte('waktu_masuk', endDate   + 'T23:59:59')
      .order('waktu_masuk', { ascending: false })
      
    if (error) toast.error('Gagal memuat data.')
    setRows(data || [])
    setLoading(false)
  }

  const downloadExcel = () => {
    let wsData
    if (reportType === 'PST') {
      wsData = rows.map((r,i) => ({
        No: i+1,
        Nama: r.nama_lengkap, Email: r.email,
        'Jenis Kelamin': r.jenis_kelamin, Pendidikan: r.pendidikan,
        Instansi: r.instansi, Kontak: r.kontak,
        Layanan: r.layanan, Catatan: r.catatan || '-',
        'Waktu Masuk': r.waktu_masuk ? formatDate(r.waktu_masuk, 'dd-MM-yyyy HH:mm') : '-',
      }))
    } else {
      wsData = rows.map((r,i) => ({
        No: i+1,
        Nama: r.nama_lengkap, 'No Identitas': r.no_identitas, 'No WA': r.no_wa,
        Instansi: r.instansi, Pekerjaan: r.pekerjaan, Alamat: r.alamat,
        'Rincian Informasi': r.rincian_informasi, 'Tujuan Penggunaan': r.tujuan_penggunaan,
        'Cara Memperoleh': r.cara_memperoleh, 'Cara Salinan': r.cara_salinan,
        'Waktu Masuk': r.waktu_masuk ? formatDate(r.waktu_masuk, 'dd-MM-yyyy HH:mm') : '-',
      }))
    }
    const ws = XLSX.utils.json_to_sheet(wsData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, `Laporan ${reportType}`)
    XLSX.writeFile(wb, `laporan_${reportType}_${startDate}_${endDate}.xlsx`)
  }

  const downloadPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' })
    doc.setFontSize(13)
    doc.text(`LAPORAN PELAYANAN ${reportType}`, 148, 14, { align: 'center' })
    doc.setFontSize(9)
    doc.text(`Periode: ${startDate} s/d ${endDate}`, 148, 21, { align: 'center' })
    doc.text('BADAN PUSAT STATISTIK — KABUPATEN LABUHANBATU UTARA', 148, 27, { align: 'center' })

    if (reportType === 'PST') {
      autoTable(doc, {
        head: [['No','Nama','Email','JK','Pendidikan','Instansi','Layanan','Waktu']],
        body: rows.map((r,i) => [
          i+1, r.nama_lengkap, r.email, r.jenis_kelamin,
          r.pendidikan, r.instansi, r.layanan,
          r.waktu_masuk ? formatDate(r.waktu_masuk, 'dd-MM-yyyy') : '-',
        ]),
        startY: 32,
        styles: { fontSize: 7.5, cellPadding: 2 },
        headStyles: { fillColor: [99,102,241], fontSize: 8 },
        alternateRowStyles: { fillColor: [245,245,255] },
      })
    } else {
      autoTable(doc, {
        head: [['No','Nama','No Identitas','No WA','Instansi','Pekerjaan','Rincian Informasi','Waktu']],
        body: rows.map((r,i) => [
          i+1, r.nama_lengkap, r.no_identitas, r.no_wa,
          r.instansi, r.pekerjaan, r.rincian_informasi,
          r.waktu_masuk ? formatDate(r.waktu_masuk, 'dd-MM-yyyy') : '-',
        ]),
        startY: 32,
        styles: { fontSize: 7.5, cellPadding: 2 },
        headStyles: { fillColor: [99,102,241], fontSize: 8 },
        alternateRowStyles: { fillColor: [245,245,255] },
      })
    }

    const finalY = doc.lastAutoTable.finalY + 12
    doc.setFontSize(9)
    const today = new Date()
    doc.text(`Gunting Saga, ${today.getDate()}-${today.getMonth()+1}-${today.getFullYear()}`, 148, finalY, { align:'center' })
    doc.text('Kepala BPS Kabupaten Labuhanbatu Utara', 148, finalY+7, { align:'center' })
    doc.text('Saip Iskandar Hasibuan, SST, M.Si', 148, finalY+28, { align:'center' })
    doc.save(`laporan_${reportType}_${startDate}_${endDate}.pdf`)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Toasts toasts={toasts} onDismiss={dismiss} />

      <RevealText>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <FileText size={20} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="page-title">Laporan Data Pengunjung</h1>
            <p className="page-subtitle">Export data pelayanan PST & PPID ke PDF / Excel</p>
          </div>
        </div>
      </RevealText>

      {/* Filter */}
      <AnimatedCard className="glass-md rounded-2xl p-5 border border-white/8">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[140px]">
            <label className="input-label flex items-center gap-1.5"><Layers size={11} /> Jenis Laporan</label>
            <select className="input-field" value={reportType} onChange={e => setReportType(e.target.value)}>
              <option value="PST" className="bg-surface-2">Pelayanan Statistik Terpadu (PST)</option>
              <option value="PPID" className="bg-surface-2">Informasi Publik (PPID)</option>
            </select>
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="input-label flex items-center gap-1.5"><Filter size={11} /> Dari Tanggal</label>
            <input type="date" className="input-field" value={startDate}
              onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="input-label">Sampai Tanggal</label>
            <input type="date" className="input-field" value={endDate}
              onChange={e => setEndDate(e.target.value)} />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={fetchData} className="btn-secondary gap-2 text-xs">
              <RefreshCw size={13} /> Tampilkan
            </button>
            <button onClick={downloadExcel} disabled={!rows.length} className="btn-success gap-2 text-xs">
              <Download size={13} /> Excel
            </button>
            <button onClick={downloadPDF} disabled={!rows.length} className="btn-primary gap-2 text-xs">
              <Download size={13} /> PDF
            </button>
          </div>
        </div>
        {!loading && (
          <p className="text-xs text-white/40 mt-3">
            Menampilkan <span className="text-brand-400 font-semibold">{rows.length}</span> data {reportType} dari {startDate} s.d. {endDate}
          </p>
        )}
      </AnimatedCard>

      {/* Table */}
      <AnimatedCard className="glass-md rounded-2xl border border-white/8 overflow-hidden" delay={0.1}>
        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(5)].map((_,i) => <div key={i} className="h-8 rounded-lg shimmer" />)}
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="data-table min-w-[900px]">
              <thead>
                {reportType === 'PST' ? (
                  <tr>
                    <th>No</th><th>Nama</th><th>Email</th><th>JK</th>
                    <th>Pendidikan</th><th>Instansi</th><th>Layanan</th>
                    <th>Kontak</th><th>Catatan</th><th>Waktu</th>
                  </tr>
                ) : (
                  <tr>
                    <th>No</th><th>Nama</th><th>No Identitas</th><th>No WA</th>
                    <th>Pekerjaan</th><th>Instansi</th><th>Rincian Informasi</th>
                    <th>Tujuan Penggunaan</th><th>Cara Peroleh</th><th>Waktu</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={10} className="text-center text-white/30 py-10">
                    Tidak ada data pada periode ini
                  </td></tr>
                ) : rows.map((r,i) => (
                  <tr key={r.id}>
                    <td className="text-white/40 text-xs">{i+1}</td>
                    <td className="font-medium whitespace-nowrap">{r.nama_lengkap}</td>
                    {reportType === 'PST' ? (
                      <>
                        <td className="text-xs text-white/60">{r.email}</td>
                        <td><span className={`badge text-[10px] ${r.jenis_kelamin==='Laki-laki'?'badge-info':'badge-purple'}`}>{r.jenis_kelamin==='Laki-laki'?'L':'P'}</span></td>
                        <td className="text-xs">{r.pendidikan}</td>
                        <td className="text-xs max-w-[140px] truncate">{r.instansi}</td>
                        <td><span className="badge badge-default text-[10px] whitespace-nowrap">{r.layanan}</span></td>
                        <td className="font-mono text-xs">{r.kontak}</td>
                        <td className="text-xs text-white/50 max-w-[120px] truncate">{r.catatan || '-'}</td>
                      </>
                    ) : (
                      <>
                        <td className="text-xs text-white/60 font-mono">{r.no_identitas}</td>
                        <td className="text-xs font-mono">{r.no_wa}</td>
                        <td className="text-xs max-w-[120px] truncate">{r.pekerjaan}</td>
                        <td className="text-xs max-w-[120px] truncate">{r.instansi}</td>
                        <td className="text-xs max-w-[150px] truncate" title={r.rincian_informasi}>{r.rincian_informasi}</td>
                        <td className="text-xs max-w-[150px] truncate" title={r.tujuan_penggunaan}>{r.tujuan_penggunaan}</td>
                        <td className="text-xs max-w-[100px] truncate">{r.cara_memperoleh}</td>
                      </>
                    )}
                    <td className="text-xs whitespace-nowrap font-mono">{r.waktu_masuk ? formatDate(r.waktu_masuk,'dd-MM-yy HH:mm') : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AnimatedCard>
    </div>
  )
}
