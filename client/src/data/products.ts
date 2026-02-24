export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: 'XIS' | 'LINHA ALHO NEGRO' | 'PORÇÕES' | 'BEBIDAS GELADAS';
  image?: string; // URL da imagem no ImgBB
}

export const products: Product[] = [
  // XIS
  {
    id: 'xis-salada',
    name: 'Xis Salada',
    price: 29.90,
    description: 'Pão, hambúrguer (180g), presunto, ovo, queijo, maionese, batata palha, alface, tomate, ervilha, milho.',
    category: 'XIS',
  },
  {
    id: 'xis-coracao',
    name: 'Xis Coração',
    price: 31.00,
    description: 'Pão, coração (180g), presunto, ovo, queijo, maionese, batata palha, alface, tomate, ervilha, milho.',
    category: 'XIS',
  },
  {
    id: 'xis-calabresa',
    name: 'Xis Calabresa',
    price: 31.00,
    description: 'Pão, calabresa, hambúrguer (180g), presunto, ovo, queijo, maionese, batata palha, alface, tomate, ervilha, milho.',
    category: 'XIS',
  },
  {
    id: 'xis-costelao',
    name: 'Xis Costelão',
    price: 33.00,
    description: 'Pão, 150g de costela desfiada, presunto, ovo, queijo, maionese, molho, batata palha, alface, tomate, ervilha, milho.',
    category: 'XIS',
  },
  {
    id: 'xis-bacon',
    name: 'Xis Bacon',
    price: 33.00,
    description: 'Pão, hambúrguer (180g), bacon, presunto, ovo, queijo, maionese, batata palha, alface, tomate, ervilha, milho.',
    category: 'XIS',
  },
  {
    id: 'xis-file-mignon',
    name: 'Xis Filé Mignon',
    price: 45.00,
    description: 'Pão, bife de filé mignon, ovo, queijo, presunto, tomate, alface, milho, ervilha, batata palha, e maionese caseira.',
    category: 'XIS',
  },
  {
    id: 'xis-alcatra',
    name: 'Xis Alcatra',
    price: 33.00,
    description: 'Pão, 150g de iscas de alcatra, presunto, ovo, queijo, maionese, molho, batata palha, alface, tomate, ervilha, milho.',
    category: 'XIS',
  },
  {
    id: 'xis-frango',
    name: 'Xis Frango',
    price: 31.00,
    description: 'Pão, frango (180g), presunto, ovo, queijo, maionese, molho, batata palha, alface, tomate, ervilha, milho.',
    category: 'XIS',
  },
  {
    id: 'xis-kids',
    name: 'Xis Kids',
    price: 24.00,
    description: 'Pão, carne (180g), molho, batata frita.',
    category: 'XIS',
  },
  {
    id: 'xis-camarao',
    name: 'Xis Camarão',
    price: 45.00,
    description: 'Pão, camarão (150g), requeijão Catupiry, 4 queijos, mussarela, maionese caseira, alface, tomate, ervilha, milho, acompanhado de maionese de alho negro.',
    category: 'XIS',
  },

  // LINHA ALHO NEGRO
  {
    id: 'alho-negro-alcatra',
    name: 'Pão de Alho Negro com Alcatra',
    price: 42.00,
    description: 'Pão de parmesão com orégano, nossa pasta exclusiva de alho negro, 180g de alcatra bovina em iscas e queijo mussarela gratinado.',
    category: 'LINHA ALHO NEGRO',
  },
  {
    id: 'alho-negro-coracao-bacon',
    name: 'Pão de Alho Negro com Coração e Bacon',
    price: 39.00,
    description: 'Pão de parmesão com orégano, pasta de alho negro cremosa, 180g de coraçãozinho temperado, bacon crocante e mussarela gratinada.',
    category: 'LINHA ALHO NEGRO',
  },
  {
    id: 'alho-negro-costela',
    name: 'Pão de Alho Negro com Costela Desfiada',
    price: 39.90,
    description: 'Pão de parmesão com orégano, pasta de alho negro artesanal, 180g de costela bovina desfiada lentamente e queijo gratinado derretendo.',
    category: 'LINHA ALHO NEGRO',
  },

  // PORÇÕES
  {
    id: 'camarao-m',
    name: 'Camarão à Milanesa M',
    price: 45.00,
    description: '250g de camarão empanado e frito.',
    category: 'PORÇÕES',
  },
  {
    id: 'camarao-g',
    name: 'Camarão à Milanesa G',
    price: 79.90,
    description: '500g de camarão empanado e frito.',
    category: 'PORÇÕES',
  },
  {
    id: 'tainha-m',
    name: 'Isca de Tainha M',
    price: 29.00,
    description: '250g de iscas de tainha frita.',
    category: 'PORÇÕES',
  },
  {
    id: 'tainha-g',
    name: 'Isca de Tainha G',
    price: 49.00,
    description: '500g de iscas de tainha frita.',
    category: 'PORÇÕES',
  },
  {
    id: 'pastel-costela',
    name: '6 Pastéis de Costela c/ Catupiry',
    price: 29.00,
    description: '6 unidades de pastel recheado com costela e catupiry.',
    category: 'PORÇÕES',
  },
  {
    id: 'pastel-camarao',
    name: '6 Pastéis de Camarão c/ Catupiry',
    price: 36.00,
    description: '6 unidades de pastel recheado com camarão e catupiry.',
    category: 'PORÇÕES',
  },
  {
    id: 'batata-m',
    name: 'Porção de Batata M',
    price: 15.00,
    description: '200g de batata frita.',
    category: 'PORÇÕES',
  },
  {
    id: 'batata-g',
    name: 'Porção de Batata G',
    price: 22.00,
    description: '400g de batata frita.',
    category: 'PORÇÕES',
  },
  {
    id: 'batata-bacon-m',
    name: 'Batata com Bacon M',
    price: 21.00,
    description: '200g de batata frita com bacon.',
    category: 'PORÇÕES',
  },
  {
    id: 'batata-bacon-g',
    name: 'Batata com Bacon G',
    price: 29.00,
    description: '400g de batata frita com bacon.',
    category: 'PORÇÕES',
  },

  // BEBIDAS GELADAS
  {
    id: 'cerveja-long-neck',
    name: 'Cervejas Long Neck',
    price: 14.00,
    description: 'Heineken ou Corona.',
    category: 'BEBIDAS GELADAS',
  },
  {
    id: 'cerveja-lata',
    name: 'Cerveja em Lata',
    price: 7.00,
    description: 'Original, bem gelada.',
    category: 'BEBIDAS GELADAS',
  },
  {
    id: 'refri-lata',
    name: 'Refrigerante Lata',
    price: 6.00,
    description: '350ml - Coca-Cola ou Guaraná Antarctica.',
    category: 'BEBIDAS GELADAS',
  },
  {
    id: 'refri-600ml',
    name: 'Refrigerante Coca-Cola 600ml',
    price: 9.00,
    description: 'Coca-Cola 600ml, bem gelada.',
    category: 'BEBIDAS GELADAS',
  },
  {
    id: 'refri-2l',
    name: 'Refrigerante Coca-Cola 2L',
    price: 15.00,
    description: 'Coca-Cola 2L, bem gelada.',
    category: 'BEBIDAS GELADAS',
  },
  {
    id: 'agua',
    name: 'Água Mineral',
    price: 5.00,
    description: '500ml - Com ou sem gás.',
    category: 'BEBIDAS GELADAS',
  },
];
