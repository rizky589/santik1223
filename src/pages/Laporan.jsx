import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, Filter, RefreshCw, Layers, Trash2, Edit } from 'lucide-react'
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

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus data ini?')) return
    const tableName = reportType === 'PST' ? 'buku_tamu' : 'ppid_permohonan'
    const { error } = await supabase.from(tableName).delete().eq('id', id)
    if (error) return toast.error('Gagal menghapus data')
    toast.success('Data berhasil dihapus')
    fetchData()
  }

  const handleEdit = (id) => {
    toast.info('Fitur edit segera hadir (masih dalam pengembangan)')
  }

  const downloadExcel = () => {
    let wsData
    if (reportType === 'PST') {
      wsData = rows.map((r,i) => ({
        No: i+1,
        Nama: r.nama_lengkap, Email: r.email, Kontak: r.kontak,
        'Jenis Kelamin': r.jenis_kelamin,
        Pekerjaan: r.pekerjaan, Instansi: r.instansi, Alamat: r.alamat,
        Layanan: r.layanan, Keperluan: r.keperluan,
        'Pegawai Tujuan': r.pegawai_tujuan, Catatan: r.catatan || '-',
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
        head: [['No','Nama/Kontak/Email','JK','Instansi/Pekerjaan','Layanan/Keperluan','Tujuan/Catatan','Waktu','Tanda Tangan']],
        body: rows.map((r,i) => [
          i+1, 
          `${r.nama_lengkap}\n${r.kontak}\n${r.email}`, 
          r.jenis_kelamin === 'Laki-laki' ? 'L' : 'P',
          `${r.instansi}\n${r.pekerjaan}`, 
          `${r.layanan}\n${r.keperluan || '-'}`,
          `${r.pegawai_tujuan}\n${r.catatan || '-'}`,
          r.waktu_masuk ? formatDate(r.waktu_masuk, 'dd-MM-yyyy') : '-',
          ''
        ]),
        startY: 32,
        styles: { fontSize: 7, cellPadding: 2, valign: 'middle' },
        headStyles: { fillColor: [99,102,241], fontSize: 8 },
        alternateRowStyles: { fillColor: [245,245,255] },
        didDrawCell: (data) => {
          if (data.section === 'body' && data.column.index === 7) {
            const r = rows[data.row.index]
            if (r.tanda_tangan) {
              doc.addImage(r.tanda_tangan, 'PNG', data.cell.x + 2, data.cell.y + 2, 20, 10)
            }
          }
        },
        bodyStyles: { minCellHeight: 15 }
      })
    } else {
      autoTable(doc, {
        head: [['No','Nama/Identitas/WA','Pekerjaan/Instansi/Alamat','Rincian & Tujuan','Cara Peroleh/Salinan','Waktu','Tanda Tangan']],
        body: rows.map((r,i) => [
          i+1, 
          `${r.nama_lengkap}\nID: ${r.no_identitas}\nWA: ${r.no_wa}`,
          `${r.pekerjaan}\n${r.instansi}\n${r.alamat}`, 
          `Info: ${r.rincian_informasi}\nTujuan: ${r.tujuan_penggunaan}`,
          `Peroleh: ${r.cara_memperoleh}\nSalinan: ${r.cara_salinan}`,
          r.waktu_masuk ? formatDate(r.waktu_masuk, 'dd-MM-yyyy') : '-',
          ''
        ]),
        startY: 32,
        styles: { fontSize: 7, cellPadding: 2, valign: 'middle' },
        headStyles: { fillColor: [99,102,241], fontSize: 8 },
        alternateRowStyles: { fillColor: [245,245,255] },
        didDrawCell: (data) => {
          if (data.section === 'body' && data.column.index === 6) {
            const r = rows[data.row.index]
            if (r.tanda_tangan) {
              doc.addImage(r.tanda_tangan, 'PNG', data.cell.x + 2, data.cell.y + 2, 20, 10)
            }
          }
        },
        bodyStyles: { minCellHeight: 15 }
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
                    <th>No</th><th>Nama/Email/Kontak</th><th>JK</th>
                    <th>Instansi/Pekerjaan</th><th>Layanan/Keperluan</th>
                    <th>Tujuan/Catatan</th><th>Waktu</th><th>Tanda Tangan</th><th className="text-center">Aksi</th>
                  </tr>
                ) : (
                  <tr>
                    <th>No</th><th>Nama/Identitas/WA</th>
                    <th>Pekerjaan/Instansi/Alamat</th><th>Rincian Informasi</th>
                    <th>Tujuan Penggunaan</th><th>Cara Peroleh</th><th>Waktu</th><th>Tanda Tangan</th><th className="text-center">Aksi</th>
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
                    {reportType === 'PST' ? (
                      <>
                        <td className="text-xs">
                          <p className="font-medium text-white">{r.nama_lengkap}</p>
                          <p className="text-white/60 font-mono">{r.kontak}</p>
                          <p className="text-white/40">{r.email}</p>
                        </td>
                        <td><span className={`badge text-[10px] ${r.jenis_kelamin==='Laki-laki'?'badge-info':'badge-purple'}`}>{r.jenis_kelamin==='Laki-laki'?'L':'P'}</span></td>
                        <td className="text-xs max-w-[140px]">
                          <p className="text-white/80">{r.instansi}</p>
                          <p className="text-white/50">{r.pekerjaan}</p>
                        </td>
                        <td className="text-xs">
                          <span className="badge badge-default text-[10px] mb-1 block w-max">{r.layanan}</span>
                          <p className="text-white/50">{r.keperluan || '-'}</p>
                        </td>
                        <td className="text-xs max-w-[140px] truncate">
                          <p className="text-white/80">{r.pegawai_tujuan}</p>
                          <p className="text-white/50">{r.catatan || '-'}</p>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="text-xs">
                          <p className="font-medium text-white">{r.nama_lengkap}</p>
                          <p className="text-white/60 font-mono">ID: {r.no_identitas}</p>
                          <p className="text-white/40 font-mono">WA: {r.no_wa}</p>
                        </td>
                        <td className="text-xs max-w-[140px]">
                          <p className="text-white/80">{r.pekerjaan}</p>
                          <p className="text-white/60">{r.instansi}</p>
                          <p className="text-white/40 truncate" title={r.alamat}>{r.alamat}</p>
                        </td>
                        <td className="text-xs max-w-[150px] truncate" title={r.rincian_informasi}>{r.rincian_informasi}</td>
                        <td className="text-xs max-w-[150px] truncate" title={r.tujuan_penggunaan}>{r.tujuan_penggunaan}</td>
                        <td className="text-xs max-w-[140px]">
                          <p className="text-white/80 truncate">Peroleh: {r.cara_memperoleh}</p>
                          <p className="text-white/50 truncate">Salinan: {r.cara_salinan}</p>
                        </td>
                      </>
                    )}
                    <td className="text-xs whitespace-nowrap font-mono">{r.waktu_masuk ? formatDate(r.waktu_masuk,'dd-MM-yy HH:mm') : '-'}</td>
                    <td>
                      {r.tanda_tangan ? (
                        <div className="bg-white/10 rounded overflow-hidden flex items-center justify-center p-1 w-16 h-8">
                          <img src={r.tanda_tangan} alt="ttd" className="max-h-full max-w-full object-contain filter invert" />
                        </div>
                      ) : (
                        <span className="text-white/20 text-[10px] italic">Tidak ada</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleEdit(r.id)} className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-lg transition-colors" title="Edit Data">
                          <Edit size={14} />
                        </button>
                        <button onClick={() => handleDelete(r.id)} className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors" title="Hapus Data">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
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
