
export const generateA4PDF = (bets: number[][], title: string = "Relatório de Jogos") => {
  // @ts-ignore
  if (!window.jspdf) {
    alert("Biblioteca PDF não carregada. Tente recarregar a página.");
    return;
  }

  // @ts-ignore
  const { jsPDF } = window.jspdf;
  
  // Configuração A4 Landscape (Paisagem)
  // Largura: 297mm, Altura: 210mm
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 297;
  const pageHeight = 210;
  
  // Layout: 3 Colunas (Volantes) por página
  const numCols = 3;
  const slipWidth = pageWidth / numCols; // 99mm por coluna
  
  // Margens internas da tira
  const slipMarginX = 5;
  const slipMarginY = 10;
  const contentWidth = slipWidth - (slipMarginX * 2);

  const gamesPerSlip = 3; 
  const totalBets = bets.length;
  const totalSlipsNeeded = Math.ceil(totalBets / gamesPerSlip);
  const totalPages = Math.ceil(totalSlipsNeeded / numCols);

  let currentBetIndex = 0;

  for (let p = 0; p < totalPages; p++) {
    if (p > 0) doc.addPage();

    for (let c = 0; c < numCols; c++) {
      // Linha de corte (pontilhada) entre volantes
      if (c > 0) {
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.1);
        doc.setLineDash([2, 2], 0);
        doc.line(c * slipWidth, 0, c * slipWidth, pageHeight);
        doc.setLineDash([]);
      }

      if (currentBetIndex >= totalBets) continue;

      const xBase = (c * slipWidth) + slipMarginX;
      const yBase = slipMarginY;

      // Coletar jogos para este volante (até 3)
      const slipBets: number[][] = [];
      for (let k = 0; k < gamesPerSlip; k++) {
        if (currentBetIndex < totalBets) {
          slipBets.push(bets[currentBetIndex]);
          currentBetIndex++;
        }
      }

      // Preencher slots vazios se houver menos de 3 jogos no último volante
      // para manter o layout visual consistente (opcional, mas fica melhor)
      while (slipBets.length < 3) {
          slipBets.push([]); // Array vazio indica jogo não preenchido
      }

      drawCleanSlip(doc, xBase, yBase, contentWidth, pageHeight - (slipMarginY * 2), slipBets);
    }
  }

  const dateStr = new Date().toISOString().slice(0,10).replace(/-/g,'');
  doc.save(`volantes_megasmart_${dateStr}.pdf`);
};

/**
 * Desenha um volante completo (Tira vertical com 3 jogos)
 */
const drawCleanSlip = (
  doc: any, 
  x: number, 
  y: number, 
  w: number, 
  h: number, 
  bets: number[][]
) => {
    const centerX = x + (w / 2);
    
    // 1. CABEÇALHO
    doc.setTextColor(0, 0, 0); // Preto
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    // Simula o logo textual
    doc.text("MEGA-SENA", centerX, y + 5, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("MARQUE SEUS NÚMEROS ABAIXO", centerX, y + 10, { align: 'center' });

    // 2. ÁREA DOS JOGOS (3 Jogos verticais)
    // Altura disponível para os grids ~120mm
    const startGamesY = y + 15;
    const gameHeight = 42; // Altura de cada bloco de jogo
    const gapBetweenGames = 6;

    bets.forEach((bet, index) => {
        const gameY = startGamesY + (index * (gameHeight + gapBetweenGames));
        
        // Label do Jogo
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(`JOGO ${index + 1}`, x, gameY - 2);

        if (bet.length > 0) {
            drawGameGrid(doc, x, gameY, w, gameHeight, bet);
        } else {
            // Desenha grade vazia para manter padrão visual
            drawGameGrid(doc, x, gameY, w, gameHeight, []);
        }
    });

    // 3. RODAPÉ (Informações e QR Code)
    const footerY = startGamesY + (3 * (gameHeight + gapBetweenGames)) + 5;
    
    // Texto Resumo
    doc.setFont("courier", "normal");
    doc.setFontSize(7);
    doc.setTextColor(50, 50, 50);

    let textY = footerY;
    bets.forEach((bet, index) => {
        if (bet.length > 0) {
            const numStr = bet.map(n => String(n).padStart(2, '0')).join(', ');
            doc.text(`Jogo ${index + 1}: ${numStr}`, x, textY);
            textY += 3;
        }
    });

    // Timestamp
    const now = new Date();
    const timeStr = `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR').substring(0, 5)}`;
    textY += 3;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.text(`Volante Gerado em ${timeStr}`, x, textY);
    textY += 3;
    doc.text("Confira o jogo impresso antes de realizar a aposta.", x, textY);

    // QR Code
    // @ts-ignore
    if (window.qrcode && bets.some(b => b.length > 0)) {
        // Conteúdo do QR: Apenas números dos jogos válidos
        const validBets = bets.filter(b => b.length > 0);
        const qrContent = validBets.map((b, i) => `J${i+1}:${b.join(',')}`).join(';');
        
        // @ts-ignore
        const qr = window.qrcode(0, 'L');
        qr.addData(qrContent);
        qr.make();
        const qrImg = qr.createDataURL(4);
        
        const qrSize = 25;
        // Posicionar QR no canto direito inferior do rodapé ou centralizado abaixo
        doc.addImage(qrImg, 'GIF', x + w - qrSize, footerY, qrSize, qrSize);
    }
};

/**
 * Desenha a grade de 60 números
 */
const drawGameGrid = (
  doc: any,
  x: number,
  y: number,
  w: number,
  h: number,
  selectedNumbers: number[]
) => {
    const rows = 6;
    const cols = 10;
    
    // A grade ocupa quase toda a largura, deixando espaço para marcas de tempo à esquerda
    const timingMarkWidth = 4;
    const gridX = x + timingMarkWidth + 2;
    const gridW = w - timingMarkWidth - 2;
    
    const cellW = gridW / cols;
    const cellH = h / rows;

    const selectedSet = new Set(selectedNumbers);

    // Marcas de sincronismo (Lateral Esquerda)
    doc.setFillColor(0, 0, 0);
    for (let r = 0; r < rows; r++) {
         const rowY = y + (r * cellH);
         const centerY = rowY + (cellH / 2);
         // Desenha retângulo preto alinhado com a linha
         doc.rect(x, centerY - 1.5, timingMarkWidth, 3, 'F');
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const num = (r * 10) + (c + 1);
            const numStr = String(num).padStart(2, '0');
            
            const cellX = gridX + (c * cellW);
            const cellY = y + (r * cellH);
            
            // Centralização
            const cx = cellX + (cellW / 2);
            const cy = cellY + (cellH / 2);

            // Desenho do "Espaço de Marcação" (Retângulo Arredondado)
            const boxW = cellW - 1.5; // Margem pequena
            const boxH = cellH - 1.5;
            const boxX = cx - (boxW / 2);
            const boxY = cy - (boxH / 2);

            if (selectedSet.has(num)) {
                // SELECIONADO: Preenchimento Preto Sólido
                doc.setFillColor(0, 0, 0);
                doc.roundedRect(boxX, boxY, boxW, boxH, 1, 1, 'F'); // 'F' = Fill
                
                // Texto branco invertido
                doc.setTextColor(255, 255, 255);
                doc.text(numStr, cx, cy + 1, { align: 'center' });
            } else {
                // NÃO SELECIONADO: Borda fina cinza
                doc.setDrawColor(150, 150, 150);
                doc.setLineWidth(0.1);
                doc.setFillColor(255, 255, 255);
                doc.roundedRect(boxX, boxY, boxW, boxH, 1, 1, 'FD'); // 'FD' = Fill & Draw (para limpar fundo)
                
                // Texto preto
                doc.setTextColor(0, 0, 0);
                doc.text(numStr, cx, cy + 1, { align: 'center' });
            }
        }
    }
};
