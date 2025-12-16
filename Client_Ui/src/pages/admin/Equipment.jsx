import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import { useToast } from '../../contexts/ToastContext'

// Icons
const DumbbellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/>
  </svg>
)

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
  </svg>
)

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><path d="M12 5v14"/>
  </svg>
)

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
  </svg>
)

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
  </svg>
)

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
)

const WrenchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
)

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="9 12 12 15 16 10"/>
  </svg>
)

const AlertCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
  </svg>
)

function Equipment() {
  const toast = useToast()
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    category: 'Cardio',
    description: '',
    quantity: 1,
    status: 'Available'
  })

  const categories = ['Cardio', 'Strength', 'Free Weights', 'Machines', 'Accessories']
  const statuses = ['Available', 'In Use', 'Maintenance', 'Out of Order']

  const equipmentImages = [
    'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=400&h=250&fit=crop',
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=250&fit=crop',
    'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=400&h=250&fit=crop',
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=250&fit=crop',
    'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=400&h=250&fit=crop',
    'https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=400&h=250&fit=crop'
  ]

  useEffect(() => {
    fetchEquipment()
  }, [])

  const fetchEquipment = async () => {
    try {
      setLoading(true)
      // Mock data
      setEquipment([
        { id: 1, name: 'Treadmill Pro X5', category: 'Cardio', description: 'Commercial grade treadmill with incline', quantity: 8, status: 'Available' },
        { id: 2, name: 'Bench Press Station', category: 'Strength', description: 'Olympic bench press with safety bars', quantity: 4, status: 'Available' },
        { id: 3, name: 'Dumbbells Set', category: 'Free Weights', description: '5-50 lbs dumbbell set with rack', quantity: 2, status: 'Available' },
        { id: 4, name: 'Cable Machine', category: 'Machines', description: 'Dual adjustable pulley system', quantity: 3, status: 'In Use' },
        { id: 5, name: 'Rowing Machine', category: 'Cardio', description: 'Air resistance rowing machine', quantity: 4, status: 'Maintenance' },
        { id: 6, name: 'Leg Press', category: 'Machines', description: '45-degree leg press machine', quantity: 2, status: 'Available' },
        { id: 7, name: 'Spin Bike', category: 'Cardio', description: 'Indoor cycling bike with digital display', quantity: 12, status: 'Available' },
        { id: 8, name: 'Kettlebell Set', category: 'Free Weights', description: '10-50 kg kettlebell collection', quantity: 1, status: 'Out of Order' }
      ])
    } catch (err) {
      console.error('Error fetching equipment:', err)
      toast.error('Failed to load equipment')
    } finally {
      setLoading(false)
    }
  }

  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return { bg: '#dcfce7', color: '#22c55e' }
      case 'In Use': return { bg: '#dbeafe', color: '#3b82f6' }
      case 'Maintenance': return { bg: '#fef3c7', color: '#f59e0b' }
      case 'Out of Order': return { bg: '#fecaca', color: '#ef4444' }
      default: return { bg: '#f5f5f5', color: '#666' }
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Available': return <CheckCircleIcon />
      case 'Maintenance': return <WrenchIcon />
      case 'Out of Order': return <AlertCircleIcon />
      default: return null
    }
  }

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Cardio': return { bg: '#fee2e2', color: '#ef4444' }
      case 'Strength': return { bg: '#dbeafe', color: '#3b82f6' }
      case 'Free Weights': return { bg: '#fef3c7', color: '#f59e0b' }
      case 'Machines': return { bg: '#d1fae5', color: '#10b981' }
      case 'Accessories': return { bg: '#e9d5ff', color: '#8b5cf6' }
      default: return { bg: '#f5f5f5', color: '#666' }
    }
  }

  const handleOpenModal = (item = null) => {
    if (item) {
      setSelectedEquipment(item)
      setFormData({
        name: item.name,
        category: item.category,
        description: item.description,
        quantity: item.quantity,
        status: item.status
      })
    } else {
      setSelectedEquipment(null)
      setFormData({ name: '', category: 'Cardio', description: '', quantity: 1, status: 'Available' })
    }
    setShowModal(true)
  }

  const handleSaveEquipment = async () => {
    if (!formData.name) {
      toast.error('Equipment name is required')
      return
    }
    try {
      if (selectedEquipment) {
        setEquipment(equipment.map(e => e.id === selectedEquipment.id ? { ...e, ...formData } : e))
        toast.success('Equipment updated successfully!')
      } else {
        setEquipment([...equipment, { id: Date.now(), ...formData }])
        toast.success('Equipment added successfully!')
      }
      setShowModal(false)
    } catch (err) {
      toast.error('Failed to save equipment')
    }
  }

  const handleDeleteEquipment = (id) => {
    if (window.confirm('Are you sure you want to delete this equipment?')) {
      setEquipment(equipment.filter(e => e.id !== id))
      toast.success('Equipment deleted')
    }
  }

  return (
    <DashboardLayout role="Admin">
      {/* Hero Banner */}
      <div className="hero-banner" style={{
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=1200&h=400&fit=crop)',
        marginBottom: '2rem'
      }}>
        <div className="hero-content">
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            Equipment <span style={{ color: '#ff6b35' }}>Management</span>
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>
            Manage gym equipment inventory and status
          </p>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            background: 'rgba(255,107,53,0.2)',
            padding: '0.5rem 1rem',
            borderRadius: '2rem',
            marginTop: '1rem',
            border: '1px solid rgba(255,107,53,0.5)'
          }}>
            <DumbbellIcon style={{ width: 18, height: 18, color: '#ff6b35' }} />
            <span style={{ color: 'white', fontWeight: '600' }}>
              {equipment.length} Equipment Items
            </span>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="card" style={{
        background: 'white',
        border: '1px solid #e0e0e0',
        borderRadius: '1rem',
        padding: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
            <SearchIcon style={{ 
              position: 'absolute', 
              left: '1rem', 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: '#999'
            }} />
            <input
              type="text"
              placeholder="Search equipment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 3rem',
                border: '2px solid #e0e0e0',
                borderRadius: '0.5rem',
                fontSize: '1rem'
              }}
            />
          </div>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              border: '2px solid #e0e0e0',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              background: 'white',
              minWidth: '150px'
            }}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              border: '2px solid #e0e0e0',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              background: 'white',
              minWidth: '150px'
            }}
          >
            <option value="all">All Status</option>
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          {/* Add Equipment Button */}
          <button
            onClick={() => handleOpenModal()}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #ff6b35, #ff8c42)',
              border: 'none',
              borderRadius: '0.5rem',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <PlusIcon />
            Add Equipment
          </button>
        </div>
      </div>

      {/* Equipment Grid */}
      {loading ? (
        <div className="card" style={{ 
          background: 'white',
          borderRadius: '1rem',
          padding: '3rem',
          textAlign: 'center'
        }}>
          <div className="loading-spinner"></div>
          <p style={{ marginTop: '1rem', color: '#666' }}>Loading equipment...</p>
        </div>
      ) : filteredEquipment.length === 0 ? (
        <div className="card" style={{ 
          background: 'white',
          border: '2px dashed #e0e0e0',
          borderRadius: '1rem',
          padding: '3rem',
          textAlign: 'center'
        }}>
          <DumbbellIcon style={{ width: 64, height: 64, color: '#ccc', margin: '0 auto 1rem' }} />
          <h3 style={{ color: '#333', marginBottom: '0.5rem' }}>No equipment found</h3>
          <p style={{ color: '#666' }}>Try adjusting your search or filters</p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {filteredEquipment.map((item, idx) => (
            <div key={item.id} className="card" style={{
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '1rem',
              overflow: 'hidden',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease'
            }}>
              {/* Image */}
              <div style={{
                height: '160px',
                backgroundImage: `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.4)), url(${equipmentImages[idx % equipmentImages.length]})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                padding: '1rem'
              }}>
                <span style={{
                  background: getCategoryColor(item.category).bg,
                  color: getCategoryColor(item.category).color,
                  padding: '0.25rem 0.75rem',
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  {item.category}
                </span>
                <span style={{
                  background: getStatusColor(item.status).bg,
                  color: getStatusColor(item.status).color,
                  padding: '0.25rem 0.75rem',
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  {getStatusIcon(item.status)}
                  {item.status}
                </span>
              </div>

              <div style={{ padding: '1.25rem' }}>
                <h3 style={{ fontWeight: '700', fontSize: '1.1rem', color: '#333', marginBottom: '0.5rem' }}>
                  {item.name}
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem', lineHeight: 1.5 }}>
                  {item.description}
                </p>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '1rem',
                  borderTop: '1px solid #e0e0e0'
                }}>
                  <div style={{
                    background: 'rgba(255,107,53,0.1)',
                    color: '#ff6b35',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    fontWeight: '700'
                  }}>
                    Qty: {item.quantity}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleOpenModal(item)}
                      style={{
                        padding: '0.5rem',
                        background: 'rgba(255,107,53,0.1)',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        color: '#ff6b35'
                      }}
                      title="Edit"
                    >
                      <EditIcon />
                    </button>
                    <button
                      onClick={() => handleDeleteEquipment(item.id)}
                      style={{
                        padding: '0.5rem',
                        background: '#fef2f2',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        color: '#ef4444'
                      }}
                      title="Delete"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Equipment Modal */}
      {showModal && (
        <div 
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '1rem',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ 
              background: 'linear-gradient(135deg, #ff6b35, #ff8c42)',
              padding: '1.5rem',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ fontWeight: '700', fontSize: '1.25rem' }}>
                {selectedEquipment ? 'Edit Equipment' : 'Add New Equipment'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'white'
                }}
              >
                <XIcon />
              </button>
            </div>
            
            <div style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontWeight: '600', color: '#333', marginBottom: '0.5rem', display: 'block' }}>
                  Equipment Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Treadmill Pro X5"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e0e0e0',
                    borderRadius: '0.5rem',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ fontWeight: '600', color: '#333', marginBottom: '0.5rem', display: 'block' }}>
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e0e0e0',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      background: 'white'
                    }}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontWeight: '600', color: '#333', marginBottom: '0.5rem', display: 'block' }}>
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e0e0e0',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      background: 'white'
                    }}
                  >
                    {statuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontWeight: '600', color: '#333', marginBottom: '0.5rem', display: 'block' }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Equipment details..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e0e0e0',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontWeight: '600', color: '#333', marginBottom: '0.5rem', display: 'block' }}>
                  Quantity
                </label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  min={1}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e0e0e0',
                    borderRadius: '0.5rem',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <button
                onClick={handleSaveEquipment}
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  background: 'linear-gradient(135deg, #ff6b35, #ff8c42)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}
              >
                {selectedEquipment ? 'Update Equipment' : 'Add Equipment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default Equipment
