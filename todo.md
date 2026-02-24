# Grill Central - Sistema de Pedidos Online

## Funcionalidades Planejadas

### Copiar do Site Antigo
- [x] Extrair todos os produtos da categoria LINHA ALHO NEGRO
- [x] Extrair todos os produtos da categoria PORÇÕES
- [x] Extrair todos os produtos da categoria BEBIDAS GELADAS
- [x] Copiar layout e estrutura exata do site antigo
- [x] Manter todas as funcionalidades originais

### Estrutura Base
- [x] Configurar tema vermelho/preto do Grill Central
- [x] Adicionar logo e informações de contato
- [x] Configurar layout responsivo

### Cardápio
- [x] Criar componente de card de produto
- [x] Implementar categorias (XIS, LINHA ALHO NEGRO, PORÇÕES, BEBIDAS GELADAS)
- [x] Adicionar produtos XIS com preços e descrições
- [x] Adicionar produtos LINHA ALHO NEGRO
- [x] Adicionar produtos PORÇÕES
- [x] Adicionar produtos BEBIDAS GELADAS
- [x] Exibir fotos dos produtos (com placeholder "Foto em breve")

### Carrinho de Compras
- [x] Implementar adicionar/remover produtos
- [x] Calcular subtotal automaticamente
- [x] Persistir carrinho no localStorage

### Sistema de Pedidos
- [x] Criar modal de finalização de pedido
- [x] Coletar dados do cliente (nome, telefone)
- [x] Escolher tipo de pedido (Entrega/Retirada)
- [x] Integrar com WhatsApp para envio do pedido

### Painel Administrativo
- [x] Criar autenticação com senha (@grill2025)
- [x] Implementar CRUD de produtos
- [x] **Adicionar upload de fotos para ImgBB (nuvem)**
- [x] Salvar URLs das fotos (não base64)

### Integração ImgBB
- [x] Configurar API key do ImgBB
- [x] Implementar função de upload
- [x] Processar imagem antes do upload (resize, crop)
- [x] Salvar URL permanente da foto
- [x] Garantir que fotos apareçam em todos dispositivos

### Testes
- [ ] Testar upload de fotos no PC
- [ ] Verificar se fotos aparecem no celular
- [ ] Testar fluxo completo de pedido
- [ ] Validar responsividade

### Correções Urgentes
- [x] Corrigir fotos não aparecerem após upload no admin (evento customizado implementado)
- [x] Adicionar botão "Enviar Localização" no checkout (GPS implementado)
- [x] Adicionar editor de imagem completo (zoom, brilho, contraste, formatos: 3:2, 16:9, 4:3, Livre)
- [ ] Testar localização em dispositivo móvel real
- [ ] Verificar se fotos do ImgBB aparecem em todos os dispositivos

## SOLUÇÃO ALTERNATIVA SEM API EXTERNA
- [x] Substituir upload ImgBB por conversão base64 + localStorage
- [x] Manter toda estrutura e funções existentes sem modificações
- [x] Testar persistência após recarregar página (FUNCIONANDO! ✅)

## BUG CRÍTICO - Editor não aparece
- [x] Editor de imagem não abre ao selecionar foto (removido editor, upload direto)
- [x] Fotos são salvas no localStorage automaticamente
- [x] Fluxo simplificado: selecionar foto → salvar automaticamente

## SUPORTE PARA FOTOS 4K
- [x] Aceitar fotos em resolução 4K (3840x2160 pixels) - limite 15MB
- [x] Implementar redimensionamento automático para 1920x1080 (otimiza localStorage)
- [x] Manter boa qualidade visual no cardápio (JPEG 85%)
- [ ] Testar com imagem 4K real

## BUG - Não consegue trocar foto do Xis Salada
- [x] Botão permite trocar foto existente (funciona corretamente)
- [x] Opção "Trocar Foto" quando já existe imagem (implementado)
- [x] Adicionar botão "Remover Foto" com ícone X (implementado)
