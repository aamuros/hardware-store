import { useState, useEffect } from 'react'
import { adminApi, categoryApi } from '../../services/api'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline'

const CATEGORY_ICONS = [
  { value: '🔧', label: 'Tools' },
  { value: '💡', label: 'Electrical' },
  { value: '🚿', label: 'Plumbing' },
  { value: '🎨', label: 'Paint' },
  { value: '🔩', label: 'Hardware' },
  { value: '🧱', label: 'Building' },
  { value: '🏠', label: 'Home' },
  { value: '🌿', label: 'Garden' },
  { value: '📦', label: 'Other' },
]

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace('/api', '')

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({ name: '', description: '', icon: '📦' })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => { fetchCategories() }, [])

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const response = await categoryApi.getAll()
      setCategories(response.data.data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const openModal = (category = null) => {
    if (category) {
      setEditingCategory(category)
      setFormData({ name: category.name, description: category.description || '', icon: category.icon || '📦' })
      setImagePreview(category.imageUrl ? `${API_BASE}${category.imageUrl}` : null)
      setImageFile(null)
      setRemoveImage(false)
    } else {
      setEditingCategory(null)
      setFormData({ name: '', description: '', icon: '📦' })
      setImagePreview(null)
      setImageFile(null)
      setRemoveImage(false)
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingCategory(null)
    setImageFile(null)
    setImagePreview(null)
    setRemoveImage(false)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      setRemoveImage(false)
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setRemoveImage(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const form = new FormData()
      form.append('name', formData.name)
      form.append('description', formData.description)
      form.append('icon', formData.icon)
      if (imageFile) form.append('image', imageFile)
      if (removeImage) form.append('removeImage', 'true')
      if (editingCategory) {
        await adminApi.updateCategory(editingCategory.id, form)
      } else {
        await adminApi.createCategory(form)
      }
      closeModal()
      fetchCategories()
    } catch (error) {
      console.error('Error saving category:', error)
      alert('Failed to save category. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (category) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"? This may affect existing products.`)) return
    setDeleting(category.id)
    try {
      await adminApi.deleteCategory(category.id)
      fetchCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Failed to delete category. It may have products associated with it.')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">Categories</h1>
          <p className="text-neutral-600">Organize your products into categories</p>
        </div>
        <button onClick={() => openModal()} className="btn btn-primary flex items-center gap-2">
          <PlusIcon className="h-5 w-5" />
          Add Category
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-800"></div>
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-soft p-12 text-center">
          <p className="text-neutral-500 mb-4">No categories yet</p>
          <button onClick={() => openModal()} className="text-accent-600 hover:text-accent-700">Add your first category</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div key={category.id} className="bg-white rounded-2xl shadow-soft p-6 hover:shadow-soft-lg transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-neutral-50 flex items-center justify-center ring-1 ring-neutral-200 overflow-hidden flex-shrink-0">
                    {category.imageUrl ? (
                      <img src={`${API_BASE}${category.imageUrl}`} alt={category.name} className="w-6 h-6 object-contain" />
                    ) : (
                      <span className="text-lg">{category.icon || '📦'}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary-900">{category.name}</h3>
                    <p className="text-sm text-neutral-500">{category._count?.products || 0} products</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openModal(category)} className="text-neutral-400 hover:text-accent-600">
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button onClick={() => handleDelete(category)} disabled={deleting === category.id} className="text-neutral-400 hover:text-red-600">
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              {category.description && <p className="mt-3 text-sm text-neutral-600">{category.description}</p>}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-primary-900/30 backdrop-blur-sm" onClick={closeModal} />
            <div className="relative bg-white rounded-2xl shadow-soft-lg max-w-md w-full">
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
                <h3 className="text-lg font-semibold text-primary-900">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h3>
                <button onClick={closeModal} className="text-neutral-400 hover:text-neutral-600">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Category Image <span className="text-neutral-400 font-normal">(Optional)</span>
                  </label>
                  <div className="flex items-center gap-4">
                    {imagePreview ? (
                      <div className="relative">
                        <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded-lg ring-1 ring-neutral-200" />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-sm"
                          title="Remove image"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 bg-neutral-100 rounded-lg flex items-center justify-center ring-1 ring-neutral-200">
                        <PhotoIcon className="h-8 w-8 text-neutral-300" />
                      </div>
                    )}
                    <div>
                      <label className="btn btn-secondary btn-sm cursor-pointer">
                        {imagePreview ? 'Change Image' : 'Upload Icon Image'}
                        <input type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml,.svg" onChange={handleImageChange} className="hidden" />
                      </label>
                      <p className="text-xs text-neutral-400 mt-2">JPG, PNG, WebP, or SVG. Max 5MB.</p>
                      <p className="text-xs text-neutral-400">This image will be the category icon.</p>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Icon <span className="text-neutral-400 font-normal">(Fallback if no image)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORY_ICONS.map((icon) => (
                      <button
                        key={icon.value}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, icon: icon.value }))}
                        className={`p-3 rounded-lg text-2xl ${formData.icon === icon.value ? 'bg-accent-100 ring-2 ring-accent-500' : 'bg-neutral-100 hover:bg-neutral-200'}`}
                        title={icon.label}
                      >
                        {icon.value}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Category Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="input w-full" placeholder="e.g., Plumbing Supplies" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Description</label>
                  <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" className="input w-full resize-none" placeholder="Brief description of this category..." />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={closeModal} className="btn bg-neutral-200 text-neutral-700 hover:bg-neutral-300">Cancel</button>
                  <button type="submit" disabled={saving} className="btn btn-primary">
                    {saving ? 'Saving...' : editingCategory ? 'Update Category' : 'Add Category'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
