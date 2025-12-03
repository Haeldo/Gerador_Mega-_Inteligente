
export const generateA4PDF = (bets: number[][], title: string = "Relatório de Jogos") => {
  // @ts-ignore
  if (!window.jspdf) {
    alert("Biblioteca PDF não carregada. Tente recarregar a página.");
    return;
  }

  // @ts-ignore
  const { jsPDF } = window.jspdf;
  
  // Configuração A4 Landscape (Deitado)
  // Largura: 297mm, Altura: 210mm
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 297;
  const pageHeight = 210;
  
  // --- DIMENSÕES EXATAS ---
  const numCols = 3; 
  const colWidth = 87; // Largura do volante
  const stripHeight = 164; // Altura do volante total
  
  // Margens calculadas (Centralizado)
  // (297 - (87 * 3)) / 2 = 18mm
  const marginLeft = (pageWidth - (colWidth * numCols)) / 2; 
  // (210 - 164) / 2 = 23mm
  const marginTop = (pageHeight - stripHeight) / 2;

  // Layout interno
  const headerHeight = 15;
  const footerHeight = 35;
  const gamesPerCol = 3; 
  
  // Altura disponível para os jogos
  const gamesAreaHeight = stripHeight - headerHeight - footerHeight;
  // Divide a altura igualmente entre os 3 jogos
  const gameBlockHeight = gamesAreaHeight / gamesPerCol;

  const gamesPerPage = numCols * gamesPerCol; // 9 jogos por página
  const totalPages = Math.ceil(bets.length / gamesPerPage);

  for (let p = 0; p < totalPages; p++) {
    if (p > 0) doc.addPage();

    // Loop pelas 3 colunas (Volantes) da página
    for (let c = 0; c < numCols; c++) {
        const xBase = marginLeft + (c * colWidth);
        const yBase = marginTop;

        // Índices globais dos jogos desta coluna
        const startGameIndex = (p * gamesPerPage) + (c * gamesPerCol);
        
        // Se não houver mais jogos para começar esta coluna, pare
        if (startGameIndex >= bets.length) break;

        // Pegar os jogos desta coluna (até 3)
        const columnBets = [];
        for(let k=0; k<gamesPerCol; k++) {
            if (bets[startGameIndex + k]) {
                columnBets.push(bets[startGameIndex + k]);
            }
        }

        // --- 1. Desenhar Cabeçalho do Volante ---
        drawHeader(doc, xBase, yBase, colWidth, headerHeight);

        // --- 2. Desenhar os Jogos e Marcas de Sincronismo ---
        // Iterar sobre as 3 áreas de jogos verticais
        for (let r = 0; r < gamesPerCol; r++) {
            const yGameStart = yBase + headerHeight + (r * gameBlockHeight);
            
            // Se tiver aposta para este bloco
            if (columnBets[r]) {
                drawOMRGameBlock(doc, xBase, yGameStart, colWidth, gameBlockHeight, columnBets[r]);
            } else {
                // Desenha o grid vazio se quiser manter a estética, ou deixa em branco.
                // Aqui desenhamos vazio para manter o padrão visual do papel
                drawOMRGameBlock(doc, xBase, yGameStart, colWidth, gameBlockHeight, []);
            }
        }

        // --- 3. Desenhar Rodapé do Volante ---
        drawFooter(doc, xBase, yBase + stripHeight - footerHeight, colWidth, footerHeight, columnBets);
        
        // Linha de corte (opcional, cinza escuro para visibilidade)
        doc.setDrawColor(100, 100, 100); // Cinza mais escuro
        doc.setLineDash([2, 2], 0);
        doc.rect(xBase, yBase, colWidth, stripHeight);
        doc.setLineDash([]); // Reset
    }
  }

  doc.save(`gabarito_mega_sena_${new Date().getTime()}.pdf`);
};

// Cabeçalho "MEGA SENA"
const drawHeader = (doc: any, x: number, y: number, w: number, h: number) => {
    doc.setTextColor(80, 80, 80); // Cinza escuro para o texto
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    const centerX = x + (w / 2);
    // Ajuste fino vertical
    doc.text("MEGA SENA", centerX, y + (h / 2) + 3, { align: 'center' });
};

// Desenha um bloco de jogo (6 linhas de números) + Marcas de Sincronismo laterais
const drawOMRGameBlock = (
    doc: any, 
    x: number, 
    y: number, 
    w: number, 
    h: number, 
    numbers: number[]
) => {
    const numberSet = new Set(numbers);
    
    // Margens internas do bloco de jogo
    const paddingLeft = 12; // Espaço para a timing mark na esquerda
    const paddingRight = 5;
    const paddingTop = 3;
    const paddingBottom = 3;

    // Área útil para os retângulos de resposta
    const gridW = w - paddingLeft - paddingRight;
    const gridH = h - paddingTop - paddingBottom;

    const rows = 6;  // 01-60
    const cols = 10; // 10 colunas
    
    const cellW = gridW / cols;
    const cellH = gridH / rows;

    // Dimensões da Marca de Sincronismo (Barra Preta Lateral)
    const timingMarkW = 5; // mm
    const timingMarkH = 3; // mm
    const timingMarkX = x + 2; // Encostado na margem esquerda do volante

    // Dimensões da Marca de Resposta (Retângulo do número)
    const answerMarkW = 6; // mm
    const answerMarkH = 3.5; // mm

    doc.setFillColor(0, 0, 0); // Preto absoluto para as marcas (IMPORTANTE: manter preto para leitura)

    for (let r = 0; r < rows; r++) {
        const rowY = y + paddingTop + (r * cellH);
        const centerY = rowY + (cellH / 2);

        // 1. DESENHAR MARCA DE SINCRONISMO (TIMING MARK) DA LINHA
        // Centralizada verticalmente com a linha de números
        doc.rect(timingMarkX, centerY - (timingMarkH / 2), timingMarkW, timingMarkH, 'F');

        // 2. DESENHAR OS NÚMEROS DA LINHA
        for (let c = 0; c < cols; c++) {
            // Calcular qual número é este (1 a 60)
            const num = (r * 10) + (c + 1);
            
            if (numberSet.has(num)) {
                const cellX = x + paddingLeft + (c * cellW);
                const centerX = cellX + (cellW / 2);

                // Desenha retângulo de resposta centralizado na célula
                doc.rect(
                    centerX - (answerMarkW / 2), 
                    centerY - (answerMarkH / 2), 
                    answerMarkW, 
                    answerMarkH, 
                    'F'
                );
            }
        }
    }
};

// Rodapé
const drawFooter = (doc: any, x: number, y: number, w: number, h: number, bets: number[][]) => {
    const pad = 5;
    doc.setTextColor(80, 80, 80); // Cinza escuro para o texto
    
    let currentY = y + 5;

    // Listar os jogos
    doc.setFont("courier", "bold"); 
    doc.setFontSize(8);

    bets.forEach((bet, idx) => {
        const numbersStr = bet.map(n => String(n).padStart(2, '0')).join('  '); // Espaço duplo
        doc.text(`JOGO ${idx + 1}:  [ ${numbersStr} ]`, x + pad, currentY);
        currentY += 4;
    });

    currentY += 4;

    // Metadados
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    const timeStr = now.toLocaleTimeString('pt-BR').slice(0, 5);
    
    doc.text(`Gerado em: ${dateStr} às ${timeStr}`, x + pad, currentY);
    currentY += 3;
    doc.setFont("helvetica", "bold");
    doc.text("CONFIRA O JOGO IMPRESSO ANTES DE APOSTAR.", x + pad, currentY);
};
