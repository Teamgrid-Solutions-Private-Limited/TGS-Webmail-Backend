const Admin = require('../models/admin.model');
const ContactQuery = require('../models/contact.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');


// 🔐 Register Admin
exports.registerAdmin = async (req, res) => {
    try {
      const { email, password, role } = req.body;
  
      // Check if admin already exists
      const existingAdmin = await Admin.findOne({ email });
      if (existingAdmin) {
        return res.status(400).json({ success: false, message: 'Email already registered' });
      }
  
      // Create and save new admin (password is auto-hashed in model)
      const newAdmin = new Admin({ email, password, role });
      await newAdmin.save();
  
      res.status(201).json({
        success: true,
        message: 'Admin registered successfully',
        data: {
          id: newAdmin._id,
          email: newAdmin.email,
          role: newAdmin.role
        }
      });
    } catch (err) {
      console.error('Admin register error:', err);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  };
  
  // 🔐 Login Admin
  exports.loginAdmin = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      const admin = await Admin.findOne({ email });
      if (!admin) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }
  
      const isMatch = await admin.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }
  
      const token = jwt.sign(
        { id: admin._id, role: admin.role },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );
  
      res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        data: {
          id: admin._id,
          email: admin.email,
          role: admin.role
        }
      });
    } catch (err) {
      console.error('Admin login error:', err);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  };

// 📋 Get All Contact Queries
exports.getAllContactQueries = async (req, res) => {
  try {
    const queries = await ContactQuery.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: queries });
  } catch (err) {
    console.error('Fetch contact queries error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// 📦 Export Contacts as CSV
exports.exportContactsCSV = async (req, res) => {
  try {
    const contacts = await ContactQuery.find().lean();
    const fields = [
      { label: 'Full Name', value: 'fullName' },
      { label: 'Email', value: 'workEmail' },
      { label: 'Phone', value: 'phoneNumber' },
      { label: 'Company', value: 'company' },
      { label: 'Topics', value: row => row.topics?.join(', ') },
      { label: 'Message', value: 'message' },
      { label: 'Created At', value: row => new Date(row.createdAt).toLocaleString() }
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(contacts);

    res.header('Content-Type', 'text/csv');
    res.attachment('contact_queries.csv');
    res.send(csv);
  } catch (err) {
    console.error('Export CSV error:', err);
    res.status(500).json({ success: false, message: 'Failed to export CSV' });
  }
};

// 📊 Export Contacts as Excel
exports.exportContactsExcel = async (req, res) => {
  try {
    const contacts = await ContactQuery.find().lean();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Contact Queries');

    worksheet.columns = [
      { header: 'Full Name', key: 'fullName' },
      { header: 'Email', key: 'workEmail' },
      { header: 'Phone', key: 'phoneNumber' },
      { header: 'Company', key: 'company' },
      { header: 'Topics', key: 'topics' },
      { header: 'Message', key: 'message' },
      { header: 'Created At', key: 'createdAt' }
    ];

    contacts.forEach(contact => {
      worksheet.addRow({
        ...contact,
        topics: contact.topics?.join(', ') || '',
        createdAt: new Date(contact.createdAt).toLocaleString()
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename=contact_queries.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Export Excel error:', err);
    res.status(500).json({ success: false, message: 'Failed to export Excel' });
  }
};

// 🧑‍💻 Assign Role to User (future use)
exports.assignRole = async (req, res) => {
  try {
    const { role } = req.body;
    const { id } = req.params;

    const updated = await Admin.findByIdAndUpdate(id, { role }, { new: true });

    if (!updated) return res.status(404).json({ success: false, message: 'User not found' });

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error('Assign role error:', err);
    res.status(500).json({ success: false, message: 'Failed to assign role' });
  }
};
