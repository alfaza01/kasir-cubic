const fs = require('fs');
let code = fs.readFileSync('src/views/IsiSaldoView.tsx', 'utf8');

// Replace definitions
code = code.replace(
  /const \[activeTab, setActiveTab\] = useState<'dompet' \| 'kategori'>\('dompet'\)[\s\S]*?const toggleKasirModalAccess =/g,
  `const [activeTab, setActiveTab] = useState<'dompet' | 'kategori'>('dompet')
  
  // Category editing states
  const [editingCatId, setEditingCatId] = useState<string | null>(null)
  const [editCatNewName, setEditCatNewName] = useState('')
  const [editCatNewFormat, setEditCatNewFormat] = useState<'nominal_admin' | 'modal_jual'>('nominal_admin')

  const saveWalletsFull = (newW: typeof walletsFull) => {
    localStorage.setItem('alphaPro_wallets_v2', JSON.stringify(newW))
    setWalletsFull(newW)
  }

  const handleSaveEditCategory = () => {
    if (!editingCatId) return
    const val = editCatNewName.trim().toUpperCase()
    if (!val) {
      props.showToast("Nama kategori tidak boleh kosong!")
      return
    }
    
    // update
    const nextW = walletsFull.map(w => {
      if (w.id === editingCatId) {
        return { ...w, name: val, format: editCatNewFormat }
      }
      return w
    })
    saveWalletsFull(nextW)
    setEditingCatId(null)
    props.showToast("Nama/Format Kategori Berhasil Disimpan")
  }

  const handleToggleHideWallet = (id: string, currentlyHidden: boolean) => {
    const nextW = walletsFull.map(w => {
      if (w.id === id) {
        if (w.isLocked) {
          props.showToast("Dompet utama ini tidak dapat disembunyikan!")
          return w
        }
        return { ...w, isHidden: !currentlyHidden }
      }
      return w
    })
    saveWalletsFull(nextW)
    props.showToast(currentlyHidden ? "Dompet ditampilkan kembali" : "Dompet disembunyikan")
  }

  const handleMoveUpCategory = (index: number) => {
    if (index === 0) return
    const newCats = [...walletsFull]
    const temp = newCats[index]
    newCats[index] = newCats[index - 1]
    newCats[index - 1] = temp
    saveWalletsFull(newCats)
    props.showToast("Berhasil dipindah ke atas")
  }

  const handleMoveDownCategory = (index: number) => {
    if (index === walletsFull.length - 1) return
    const newCats = [...walletsFull]
    const temp = newCats[index]
    newCats[index] = newCats[index + 1]
    newCats[index + 1] = temp
    saveWalletsFull(newCats)
    props.showToast("Berhasil dipindah ke bawah")
  }

  useEffect(() => {
    if (props.active) {
      setWalletsFull(getWallets())
      const accounts = getKasirAccounts()
      const kasirArr = Object.values(accounts).filter(k => k.role === 'kasir' || k.role === 'owner')
      setKasirList(kasirArr)
    }
  }, [props.active])

  const toggleKasirModalAccess =`
);

fs.writeFileSync('src/views/IsiSaldoView.tsx', code);
