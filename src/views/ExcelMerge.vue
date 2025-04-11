<template>
  <div class="excel-merge">
    <h1 class="text-center">Excel文件合并工具</h1>
    
    <div class="container bg-white p-4 rounded shadow-sm">
      <h3 class="text-center">上传Excel文件</h3>
      <div class="text-center mb-3">
        <label for="fileInput" class="btn btn-info">选择Excel文件</label>
        <input type="file" id="fileInput" ref="fileInput" multiple accept=".xlsx, .xls" @change="handleFileChange" class="d-none" />
      </div>
      
      <div class="file-list border rounded p-3 mb-4" style="max-height: 300px; overflow-y: auto;">
        <div v-if="selectedFiles.length === 0" class="file-item d-flex justify-content-between align-items-center p-2">
          <div class="file-name">尚未选择文件</div>
        </div>
        <div v-for="(file, index) in selectedFiles" :key="index" class="file-item d-flex justify-content-between align-items-center p-2 border-bottom">
          <div class="file-name">{{ index + 1 }}. {{ file.name }} ({{ formatFileSize(file.size) }})</div>
          <button class="btn btn-danger btn-sm" @click="removeFile(index)">移除</button>
        </div>
      </div>
      
      <div class="options">
        <h3 class="text-center">合并选项</h3>
        <div class="mb-2">
          <input type="checkbox" id="headerCheckbox" v-model="useHeaderFromFirstFile">
          <label for="headerCheckbox" class="ms-2">第一个文件的表头作为合并后的表头</label>
        </div>
        <div class="mb-2">
          <input type="checkbox" id="sheetNameCheckbox" v-model="useFilenameAsSheetName">
          <label for="sheetNameCheckbox" class="ms-2">使用文件名作为工作表名</label>
        </div>
        <div class="mb-3">
          <label for="mergeType" class="me-2">合并方式：</label>
          <select id="mergeType" v-model="mergeType" class="form-select">
            <option value="vertical">垂直合并（上下合并）</option>
            <option value="horizontal">水平合并（左右合并）</option>
            <option value="sheets">分表合并（每个文件作为单独的工作表）</option>
          </select>
        </div>
      </div>
      
      <div class="text-center mb-3">
        <button class="btn btn-primary me-2" @click="mergeExcel" :disabled="selectedFiles.length < 2">合并Excel</button>
        <button class="btn btn-secondary" @click="clearFiles" :disabled="selectedFiles.length === 0">清除所有文件</button>
      </div>
      
      <div class="progress mb-3" v-show="showProgress">
        <div class="progress-bar" role="progressbar" :style="{ width: progressPercent + '%' }" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
      </div>
      
      <div class="status text-center fst-italic text-muted" v-if="statusMessage">{{ statusMessage }}</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ExcelMerge',
  data() {
    return {
      selectedFiles: [],
      useHeaderFromFirstFile: true,
      useFilenameAsSheetName: true,
      mergeType: 'vertical',
      showProgress: false,
      progressPercent: 0,
      statusMessage: ''
    }
  },
  methods: {
    handleFileChange(event) {
      const files = event.target.files;
      if (files.length === 0) return;
      
      // 添加到已选文件列表
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // 检查是否已经添加过相同的文件
        if (!this.selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
          this.selectedFiles.push(file);
        }
      }
      
      // 重置文件输入，以便可以再次选择相同的文件
      this.$refs.fileInput.value = '';
    },
    removeFile(index) {
      this.selectedFiles.splice(index, 1);
    },
    clearFiles() {
      this.selectedFiles = [];
      this.statusMessage = '';
    },
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    setStatus(message) {
      this.statusMessage = message;
    },
    updateProgress(percent) {
      this.showProgress = true;
      this.progressPercent = percent;
      
      if (percent >= 100) {
        setTimeout(() => {
          this.showProgress = false;
          this.progressPercent = 0;
        }, 1000);
      }
    },
    async mergeExcel() {
      if (this.selectedFiles.length < 2) {
        this.setStatus('请至少选择两个Excel文件进行合并');
        return;
      }
      
      this.setStatus('正在处理文件...');
      this.updateProgress(10);
      
      try {
        const workbooks = [];
        const totalFiles = this.selectedFiles.length;
        
        // 读取所有文件
        for (let i = 0; i < totalFiles; i++) {
          const file = this.selectedFiles[i];
          const data = await this.readFileAsArrayBuffer(file);
          const workbook = XLSX.read(data, { type: 'array' });
          workbooks.push({
            name: file.name,
            workbook: workbook
          });
          
          this.updateProgress(10 + (i + 1) / totalFiles * 40);
        }
        
        this.updateProgress(50);
        this.setStatus('正在合并文件...');
        
        // 创建新的工作簿
        const mergedWorkbook = XLSX.utils.book_new();
        
        if (this.mergeType === 'sheets') {
          // 分表合并 - 每个文件作为单独的工作表
          workbooks.forEach((wb, index) => {
            const sheetName = wb.workbook.SheetNames[0];
            const worksheet = wb.workbook.Sheets[sheetName];
            let jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            // 清除空行和空单元格
            jsonData = jsonData.filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ''));
            jsonData = jsonData.map(row => row.map(cell => cell === null || cell === undefined ? '' : cell));
            
            const cleanedWorksheet = XLSX.utils.aoa_to_sheet(jsonData);
            
            let newSheetName = this.useFilenameAsSheetName 
              ? wb.name.replace(/\.[^/.]+$/, "")
              : `Sheet${index + 1}`;
              
            if (newSheetName.length > 31) {
              newSheetName = newSheetName.substring(0, 28) + '...';
            }
            
            XLSX.utils.book_append_sheet(mergedWorkbook, cleanedWorksheet, newSheetName);
            this.updateProgress(50 + (index + 1) / totalFiles * 30);
          });
        } else {
          // 垂直或水平合并
          let mergedData = [];
          let headers = [];
          
          workbooks.forEach((wb, index) => {
            const sheetName = wb.workbook.SheetNames[0];
            const worksheet = wb.workbook.Sheets[sheetName];
            let jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            // 清除空行和空单元格
            jsonData = jsonData.filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ''));
            jsonData = jsonData.map(row => row.map(cell => cell === null || cell === undefined ? '' : cell));
            
            if (jsonData.length === 0) return;
            
            if (index === 0 || !this.useHeaderFromFirstFile) {
              if (this.mergeType === 'vertical') {
                mergedData = mergedData.concat(jsonData);
              } else {
                mergedData = jsonData.map(row => [...row]);
                headers = jsonData[0] || [];
              }
            } else {
              if (this.mergeType === 'vertical') {
                const dataWithoutHeader = this.useHeaderFromFirstFile ? jsonData.slice(1) : jsonData;
                mergedData = mergedData.concat(dataWithoutHeader);
              } else {
                const dataRows = this.useHeaderFromFirstFile ? jsonData.slice(1) : jsonData;
                const currentHeaders = this.useHeaderFromFirstFile ? jsonData[0] : [];
                
                if (currentHeaders && currentHeaders.length > 0) {
                  headers = [...headers, ...currentHeaders];
                  if (mergedData[0]) {
                    mergedData[0] = [...mergedData[0], ...currentHeaders];
                  }
                }
                
                dataRows.forEach((row, rowIndex) => {
                  const targetRowIndex = this.useHeaderFromFirstFile ? rowIndex + 1 : rowIndex;
                  
                  if (!mergedData[targetRowIndex]) {
                    const emptyRow = Array(mergedData[0] ? mergedData[0].length - row.length : 0).fill('');
                    mergedData[targetRowIndex] = [...emptyRow, ...row];
                  } else {
                    mergedData[targetRowIndex] = [...mergedData[targetRowIndex], ...row];
                  }
                });
              }
            }
            
            this.updateProgress(50 + (index + 1) / totalFiles * 30);
          });
          
          // 最后再次清除合并后数据中的空行
          mergedData = mergedData.filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ''));
          
          const worksheet = XLSX.utils.aoa_to_sheet(mergedData);
          XLSX.utils.book_append_sheet(mergedWorkbook, worksheet, "合并数据");
        }
        
        this.updateProgress(90);
        this.setStatus('正在生成合并后的Excel文件...');
        
        // 生成并下载合并后的Excel文件
        const excelBuffer = XLSX.write(mergedWorkbook, { bookType: 'xlsx', type: 'array' });
        this.saveAsExcelFile(excelBuffer, '合并后的Excel文件.xlsx');
        
        this.updateProgress(100);
        this.setStatus('合并完成！文件已下载。');
      } catch (error) {
        console.error('合并过程中出错:', error);
        this.setStatus('合并过程中出错: ' + error.message);
        this.updateProgress(0);
      }
    },
    readFileAsArrayBuffer(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e.target.error);
        reader.readAsArrayBuffer(file);
      });
    },
    saveAsExcelFile(buffer, fileName) {
      const blob = new Blob([buffer], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  }
}
</script>

<style scoped>
.excel-merge {
  margin-bottom: 2rem;
}
.file-item:last-child {
  border-bottom: none !important;
}
</style>