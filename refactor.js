const fs = require('fs');
const path = require('path');

const replacements = [
  { from: 'PrintersModule', to: 'MachinesModule' },
  { from: 'printers/printers.module', to: 'machines/machines.module' },
  { from: 'PrintersController', to: 'MachinesController' },
  { from: 'PrintersService', to: 'MachinesService' },
  { from: 'PrinterStatus', to: 'MachineStatus' },
  { from: 'printers/entities/printer.entity', to: 'machines/entities/machine.entity' },
  { from: 'Printer', to: 'Machine' },
  { from: 'printerRepository', to: 'machineRepository' },
  { from: 'printer_id', to: 'machine_id' },
  { from: 'printerId', to: 'machineId' },
  { from: '\\bprinters\\b', to: 'machines', isRegex: true },
  { from: '\\bprinter\\b', to: 'machine', isRegex: true },
  { from: '\\bPrinters\\b', to: 'Machines', isRegex: true },
  { from: '\\bPRINTERS\\b', to: 'MACHINES', isRegex: true },
  { from: '\\bPRINTER\\b', to: 'MACHINE', isRegex: true },
];

function processDirectory(directory) {
  const items = fs.readdirSync(directory);
  
  for (const item of items) {
    const fullPath = path.join(directory, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (item !== 'node_modules' && item !== '.git') {
        processDirectory(fullPath);
      }
    } else if (fullPath.endsWith('.ts') && !fullPath.includes('migration')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      for (const { from, to, isRegex } of replacements) {
        let regex = isRegex ? new RegExp(from, 'g') : new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        content = content.replace(regex, to);
      }
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDirectory('./src');
