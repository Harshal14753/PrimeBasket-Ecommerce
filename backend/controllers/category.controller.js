import Category from '../models/category.model.js';

// ─────────────────────────────────────────────
// POST /api/category
// Auth Required | Role: admin
// ─────────────────────────────────────────────
export const createCategory = async (req, res) => {
    try {
        const { name, parentCategory } = req.body;

        // Check if category with the same name already exists
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({ message: 'Category with this name already exists' });
        }
        // Determine the level of the category by using the for loop to find the parent category and its level
        let level = 0;
        if (parentCategory) {
            const parent = await Category.findById(parentCategory);
            if (!parent) {
                return res.status(400).json({ message: 'Parent category not found' });
            }
            level = parent.level + 1;
        }
        const category = new Category({ name, parentCategory, level });
        await category.save();
        res.status(201).json(category);
        
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// ─────────────────────────────────────────────
// GET /api/category
// No Auth Required
// ─────────────────────────────────────────────
export const getCategories = async (req, res) => {
    try {
        const categories = await Category.find().populate('parentCategory', 'name');
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// ─────────────────────────────────────────────
// GET /api/category/:id
// No Auth Required
// ─────────────────────────────────────────────
export const getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id).populate('parentCategory', 'name');
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.status(200).json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// ─────────────────────────────────────────────
// PUT /api/category/:id
// Auth Required | Role: admin
// ─────────────────────────────────────────────
export const updateCategory = async (req, res) => {
    try {
        const { name, parentCategory } = req.body;
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        category.name = name;
        category.parentCategory = parentCategory;
        await category.save();
        res.status(200).json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// ─────────────────────────────────────────────
// DELETE /api/category/:id
// Auth Required | Role: admin
// ─────────────────────────────────────────────
export const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        await category.remove();
        res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}