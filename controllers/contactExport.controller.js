const ContactQuery = require('../models/contact.model');
const { Parser } = require('json2csv');
const XLSX = require('xlsx');

exports.exportContacts = async (req, res) => {
  try {
    const contacts = await ContactQuery.find().lean(); // fetch as plain JS objects
    const format = req.query.format || 'json';

    if (format === 'csv') {
      const fields = ['fullName', 'workEmail', 'phoneNumber', 'company', 'topics', 'message', 'createdAt'];
      const parser = new Parser({ fields });
      const csv = parser.parse(contacts);

      res.header('Content-Type', 'text/csv');
      res.attachment('contacts.csv');
      return res.send(csv);
    }

    if (format === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(contacts);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Contacts');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Disposition', 'attachment; filename="contacts.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      return res.send(buffer);
    }

    // Default: JSON
    res.header('Content-Type', 'application/json');
    res.attachment('contacts.json');
    return res.send(JSON.stringify(contacts, null, 2));

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ success: false, message: 'Failed to export contacts' });
  }
};
