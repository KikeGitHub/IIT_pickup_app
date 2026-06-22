// Base de Datos Compartida en LocalStorage para Stitch Pickup

const DEFAULT_GROUPS = {
    KINDER: ['1º A', '1º B', '2º A', '2º B'],
    PRIMARIA: [
        '1º A', '1º B', '1º C', '1º D', '1º E', 
        '2º A', '2º B', '2º C', '2º D', '2º E', 
        '3º A', '3º B', '3º C', '3º D', '3º E', 
        '4º A', '4º B', '4º C', '4º D', '4º E', 
        '5º A', '5º B', '5º C', '5º D', '5º E', 
        '6º A', '6º B', '6º C', '6º D', '6º E'
    ],
    SECUNDARIA: [
        '1º A', '1º B', '1º C', '1º D', 
        '2º A', '2º B', '2º C', '2º D', 
        '3º A', '3º B', '3º C', '3º D'
    ]
};

const DEFAULT_STUDENTS = [
    // KÍNDER (5)
    { 
        id: 'mateo_estrada', 
        name: 'MATEO ESTRADA', 
        level: 'KINDER', 
        grade: '1º KÍNDER', 
        group: '1º A', 
        birthday: '2021-04-12',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDb0AhBhLBFFNOaKEk0STIdgdoXtR0dJ8s6KbR2GjnUoV-qgZnF973vhCduo94UDZGlPNhysCxlnZmCCRuLcK49gQLPgXCFxod4bk8JfBOeqTs8GeR7ChIM734O0_4A4esKNyfQTEEYrYltq1v8yD5Alh6-alYoJVeEmpdJveyhC_9vZD8wfSIr0DKCerceTxOZQYmoMLbozYunDIBcodGxKR_EFZ--GwNx3BieSqPYauTJmcBomKAgHKkmcwZmsg_VmCrjoi2SSW0', 
        parent: 'Sofía de Estrada',
        family: [
            { name: 'Sofía de Estrada', relationship: 'Madre', phone: '7221234567', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'Ricardo Estrada', relationship: 'Padre', phone: '7229876543', photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'Elena Martínez', relationship: 'Abuela', phone: '7224567890', photo: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=150', authorized: true }
        ]
    },
    { 
        id: 'sofia_hernandez', 
        name: 'SOFÍA HERNÁNDEZ', 
        level: 'KINDER', 
        grade: '1º KÍNDER', 
        group: '1º A', 
        birthday: '2021-08-23',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAt26n3kin1y74Y4yE0a2wZNRwM8iJ3k9HiSRTvU_HAhWFnLvRQ9ucyfFgm-o8BEWIXFGWkWovyg7vigZzYQphdXriMr3-0zyukU9iWb5odtlrfxLMSxQRWbuAedMLZ5e5CQI1DERl8RYpZyUqEm3ASxo-mPxf0pK3fWPFVjameMS7BMjpfLEn1SvYzjF_39vIkGlrlAsjyXi_89_botb8AdYn66ZbCd-97lUclnr3Ms9ovxKj43SmWUGDXABgKhFlMyVJO2ci7cO0', 
        parent: 'Pedro Hernández',
        family: [
            { name: 'Pedro Hernández', relationship: 'Padre', phone: '7225550192', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'Lucía de Hernández', relationship: 'Madre', phone: '7225550193', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'Mario Hernández', relationship: 'Tío', phone: '7225550194', photo: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=150', authorized: true }
        ]
    },
    { 
        id: 'santiago_perez', 
        name: 'SANTIAGO PÉREZ', 
        level: 'KINDER', 
        grade: '1º KÍNDER', 
        group: '1º B', 
        birthday: '2021-02-15',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBSjH25FZv4tA8v_m--vMmYkOqzv9p6io65EZTIEZrxiyNX3BDt2dSWMsMbd2HVhGCo63q2SvOnNAeFQbT2Iuf-b9Ew-EajvSkp2KKpTNBmuodJc29xy0fR5pE6FG520lj_imxRdTMUxymznW7_zJCpVFVpguvETQ88Nu7gah5fEhdJoOQM0eg35ZnzJKijgWfxXOazxyEyma5c-jJJrWfd_S6-1Pb7SvkmbKMWBSXKAuBtQ_6EHG8QhnnoudOjTRBGMV1evoK_WHI', 
        parent: 'Carlos Pérez',
        family: [
            { name: 'Carlos Pérez', relationship: 'Padre', phone: '7225550291', photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'Carmen Pérez', relationship: 'Madre', phone: '7225550292', photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'Felipe Pérez', relationship: 'Hermano Mayor', phone: '7225550293', photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150', authorized: false }
        ]
    },
    { 
        id: 'valentina_gomez', 
        name: 'VALENTINA GÓMEZ', 
        level: 'KINDER', 
        grade: '2º KÍNDER', 
        group: '2º A', 
        birthday: '2020-11-05',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA9CoF4geOWXY_-UpBIO-ye4Rxrd4dQ6xK1Zu-SAtrxQqGrwQ6SS0Cq03y0Qfw5Ct2ClO6vK3W6wYBo-kxbzvqvNr3lZk6TFAsbMQhEegnnMKhYHd3X3XfW-EEF51Nw3tLuO_Hqat_IeOVxAhmnFjLY2rpLKzZIzQh5JO1vn_bRSPi-XrXBGHj4VxU8NBO9k9oj2DJToj7pNNreQoZdCEK1_DKHnwhJWyJu2k7Ub4FgefcNYsqEZZEXFnQj9XGk6Oi7tPmQo8n7pEE', 
        parent: 'Ana Gómez',
        family: [
            { name: 'Ana Gómez', relationship: 'Madre', phone: '7225550301', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'José Gómez', relationship: 'Padre', phone: '7225550302', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'Clara Gómez', relationship: 'Tía', phone: '7225550303', photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150', authorized: true }
        ]
    },
    { 
        id: 'sebastian_ruiz', 
        name: 'SEBASTIÁN RUIZ', 
        level: 'KINDER', 
        grade: '2º KÍNDER', 
        group: '2º B', 
        birthday: '2020-07-14',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDamV-AxVX491bDDytyEEK7Iehi_1UjOCwEFwwTlS3vILOq2UerdikC8pZgWAyYpDjcYr6Yhd6pKH7fai8LFpelsKe0DeBsCbU8kjK8R5AffCkv2LhipkpHpohnQiSxwc-2tPftTidux_zw_IWlAIV9QooQ1UYb3OuHWXZV6yonFvup9cOOzHsXdjPyoItv6FWfmHT9G1T8js9yeBTvv2leMX7QNkEtahl4tX3pFB-9GEPfx_Vj_p9RMm9FzGDSCofS4HWo8di_Zdk', 
        parent: 'Laura Ruiz',
        family: [
            { name: 'Laura Ruiz', relationship: 'Madre', phone: '7225550411', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'Mauricio Ruiz', relationship: 'Padre', phone: '7225550412', photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'Teresa Ruiz', relationship: 'Abuela', phone: '7225550413', photo: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=150', authorized: true }
        ]
    },

    // PRIMARIA (10)
    { 
        id: 'isabella_torres', 
        name: 'ISABELLA TORRES', 
        level: 'PRIMARIA', 
        grade: '1º PRIMARIA', 
        group: '1º B', 
        birthday: '2019-01-30',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA9CoF4geOWXY_-UpBIO-ye4Rxrd4dQ6xK1Zu-SAtrxQqGrwQ6SS0Cq03y0Qfw5Ct2ClO6vK3W6wYBo-kxbzvqvNr3lZk6TFAsbMQhEegnnMKhYHd3X3XfW-EEF51Nw3tLuO_Hqat_IeOVxAhmnFjLY2rpLKzZIzQh5JO1vn_bRSPi-XrXBGHj4VxU8NBO9k9oj2DJToj7pNNreQoZdCEK1_DKHnwhJWyJu2k7Ub4FgefcNYsqEZZEXFnQj9XGk6Oi7tPmQo8n7pEE', 
        parent: 'Miguel Torres',
        family: [
            { name: 'Miguel Torres', relationship: 'Padre', phone: '7225550501', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'Beatriz Torres', relationship: 'Madre', phone: '7225550502', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'Jorge Torres', relationship: 'Tío', phone: '7225550503', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150', authorized: true }
        ]
    },
    { 
        id: 'natalia_diaz', 
        name: 'NATALIA DÍAZ', 
        level: 'PRIMARIA', 
        grade: '1º PRIMARIA', 
        group: '1º E', 
        birthday: '2019-09-18',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAt26n3kin1y74Y4yE0a2wZNRwM8iJ3k9HiSRTvU_HAhWFnLvRQ9ucyfFgm-o8BEWIXFGWkWovyg7vigZzYQphdXriMr3-0zyukU9iWb5odtlrfxLMSxQRWbuAedMLZ5e5CQI1DERl8RYpZyUqEm3ASxo-mPxf0pK3fWPFVjameMS7BMjpfLEn1SvYzjF_39vIkGlrlAsjyXi_89_botb8AdYn66ZbCd-97lUclnr3Ms9ovxKj43SmWUGDXABgKhFlMyVJO2ci7cO0', 
        parent: 'Martha Díaz',
        family: [
            { name: 'Martha Díaz', relationship: 'Madre', phone: '7225550601', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'Esteban Díaz', relationship: 'Padre', phone: '7225550602', photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'Rosa Díaz', relationship: 'Tía', phone: '7225550603', photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150', authorized: true }
        ]
    },
    { 
        id: 'alejandro_flores', 
        name: 'ALEJANDRO FLORES', 
        level: 'PRIMARIA', 
        grade: '2º PRIMARIA', 
        group: '2º C', 
        birthday: '2018-03-05',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBSjH25FZv4tA8v_m--vMmYkOqzv9p6io65EZTIEZrxiyNX3BDt2dSWMsMbd2HVhGCo63q2SvOnNAeFQbT2Iuf-b9Ew-EajvSkp2KKpTNBmuodJc29xy0fR5pE6FG520lj_imxRdTMUxymznW7_zJCpVFVpguvETQ88Nu7gah5fEhdJoOQM0eg35ZnzJKijgWfxXOazxyEyma5c-jJJrWfd_S6-1Pb7SvkmbKMWBSXKAuBtQ_6EHG8QhnnoudOjTRBGMV1evoK_WHI', 
        parent: 'Patricia Flores',
        family: [
            { name: 'Patricia Flores', relationship: 'Madre', phone: '7225550701', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'Guillermo Flores', relationship: 'Padre', phone: '7225550702', photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'Sofía Flores', relationship: 'Hermana', phone: '7225550703', photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150', authorized: true }
        ]
    },
    { 
        id: 'lucia_guerrero', 
        name: 'LUCÍA GUERRERO', 
        level: 'PRIMARIA', 
        grade: '2º PRIMARIA', 
        group: '2º D', 
        birthday: '2018-12-11',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAt26n3kin1y74Y4yE0a2wZNRwM8iJ3k9HiSRTvU_HAhWFnLvRQ9ucyfFgm-o8BEWIXFGWkWovyg7vigZzYQphdXriMr3-0zyukU9iWb5odtlrfxLMSxQRWbuAedMLZ5e5CQI1DERl8RYpZyUqEm3ASxo-mPxf0pK3fWPFVjameMS7BMjpfLEn1SvYzjF_39vIkGlrlAsjyXi_89_botb8AdYn66ZbCd-97lUclnr3Ms9ovxKj43SmWUGDXABgKhFlMyVJO2ci7cO0', 
        parent: 'Silvia Guerrero',
        family: [
            { name: 'Silvia Guerrero', relationship: 'Madre', phone: '7225550801', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'Arturo Guerrero', relationship: 'Padre', phone: '7225550802', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'Abuela Clara', relationship: 'Abuela', phone: '7225550803', photo: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=150', authorized: true }
        ]
    },
    { 
        id: 'diego_ramirez', 
        name: 'DIEGO RAMÍREZ', 
        level: 'PRIMARIA', 
        grade: '3º PRIMARIA', 
        group: '3º A', 
        birthday: '2017-06-25',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDamV-AxVX491bDDytyEEK7Iehi_1UjOCwEFwwTlS3vILOq2UerdikC8pZgWAyYpDjcYr6Yhd6pKH7fai8LFpelsKe0DeBsCbU8kjK8R5AffCkv2LhipkpHpohnQiSxwc-2tPftTidux_zw_IWlAIV9QooQ1UYb3OuHWXZV6yonFvup9cOOzHsXdjPyoItv6FWfmHT9G1T8js9yeBTvv2leMX7QNkEtahl4tX3pFB-9GEPfx_Vj_p9RMm9FzGDSCofS4HWo8di_Zdk', 
        parent: 'José Ramírez',
        family: [
            { name: 'José Ramírez', relationship: 'Padre', phone: '7225550911', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'Elena Ramírez', relationship: 'Madre', phone: '7225550912', photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'Pedro Ramírez', relationship: 'Hermano', phone: '7225550913', photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150', authorized: false }
        ]
    },
    { 
        id: 'rodrigo_alcaraz', 
        name: 'RODRIGO ALCARAZ', 
        level: 'PRIMARIA', 
        grade: '4º PRIMARIA', 
        group: '4º A', 
        birthday: '2016-10-15',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDwpuJZDPbBPnxc4UO7C8vqF3WsJqAmpsEnOFKi7mSbQ1hcxxNLTebljSmLxDuh84qZ3GuSQo8m9NWRyShiBGNF-vCxGoF7qPJTDRXOJLKTGLDVHcTsGlbAfsHvewYGSA9iPRj0rdTMrWWJAUGyZDYaRBr1FjYxyCzLaEtu-MRHoQwbgfAwQZzJ5vkj2jjQs3gYGyAhBV92lkIiHL8GPl7uzM_efkcLrTIMnTLdyo-IE7PvK5WNJHAaM1J717rSVUYOZg2X7lIB_e4', 
        parent: 'Juan P. Alcaraz',
        family: [
            { name: 'Juan P. Alcaraz', relationship: 'Padre', phone: '7225551011', photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'Marta de Alcaraz', relationship: 'Madre', phone: '7225551012', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'Sofía Alcaraz', relationship: 'Tía', phone: '7225551013', photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150', authorized: true }
        ]
    },
    { 
        id: 'bruno_mendoza', 
        name: 'BRUNO MENDOZA', 
        level: 'PRIMARIA', 
        grade: '4º PRIMARIA', 
        group: '4º C', 
        birthday: '2016-02-28',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDamV-AxVX491bDDytyEEK7Iehi_1UjOCwEFwwTlS3vILOq2UerdikC8pZgWAyYpDjcYr6Yhd6pKH7fai8LFpelsKe0DeBsCbU8kjK8R5AffCkv2LhipkpHpohnQiSxwc-2tPftTidux_zw_IWlAIV9QooQ1UYb3OuHWXZV6yonFvup9cOOzHsXdjPyoItv6FWfmHT9G1T8js9yeBTvv2leMX7QNkEtahl4tX3pFB-9GEPfx_Vj_p9RMm9FzGDSCofS4HWo8di_Zdk', 
        parent: 'David Mendoza',
        family: [
            { name: 'David Mendoza', relationship: 'Padre', phone: '7225551101', photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'Lorena Mendoza', relationship: 'Madre', phone: '7225551102', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'Alberto Mendoza', relationship: 'Abuelo', phone: '7225551103', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150', authorized: true }
        ]
    },
    { 
        id: 'leonardo_morales', 
        name: 'LEONARDO MORALES', 
        level: 'PRIMARIA', 
        grade: '5º PRIMARIA', 
        group: '5º B', 
        birthday: '2015-05-09',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDwpuJZDPbBPnxc4UO7C8vqF3WsJqAmpsEnOFKi7mSbQ1hcxxNLTebljSmLxDuh84qZ3GuSQo8m9NWRyShiBGNF-vCxGoF7qPJTDRXOJLKTGLDVHcTsGlbAfsHvewYGSA9iPRj0rdTMrWWJAUGyZDYaRBr1FjYxyCzLaEtu-MRHoQwbgfAwQZzJ5vkj2jjQs3gYGyAhBV92lkIiHL8GPl7uzM_efkcLrTIMnTLdyo-IE7PvK5WNJHAaM1J717rSVUYOZg2X7lIB_e4', 
        parent: 'Francisco Morales',
        family: [
            { name: 'Francisco Morales', relationship: 'Padre', phone: '7225551201', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'Gabriela Morales', relationship: 'Madre', phone: '7225551202', photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'Luis Morales', relationship: 'Tío', phone: '7225551203', photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150', authorized: true }
        ]
    },
    { 
        id: 'mateo_gutierrez', 
        name: 'MATEO GUTIÉRREZ', 
        level: 'PRIMARIA', 
        grade: '5º PRIMARIA', 
        group: '5º E', 
        birthday: '2015-11-20',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAt26n3kin1y74Y4yE0a2wZNRwM8iJ3k9HiSRTvU_HAhWFnLvRQ9ucyfFgm-o8BEWIXFGWkWovyg7vigZzYQphdXriMr3-0zyukU9iWb5odtlrfxLMSxQRWbuAedMLZ5e5CQI1DERl8RYpZyUqEm3ASxo-mPxf0pK3fWPFVjameMS7BMjpfLEn1SvYzjF_39vIkGlrlAsjyXi_89_botb8AdYn66ZbCd-97lUclnr3Ms9ovxKj43SmWUGDXABgKhFlMyVJO2ci7cO0', 
        parent: 'Raúl Gutiérrez',
        family: [
            { name: 'Raúl Gutiérrez', relationship: 'Padre', phone: '7225551301', photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'Isabel Gutiérrez', relationship: 'Madre', phone: '7225551302', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'Manuel Gutiérrez', relationship: 'Hermano', phone: '7225551303', photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150', authorized: true }
        ]
    },
    { 
        id: 'camila_castillo', 
        name: 'CAMILA CASTILLO', 
        level: 'PRIMARIA', 
        grade: '6º PRIMARIA', 
        group: '6º A', 
        birthday: '2014-07-07',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDb0AhBhLBFFNOaKEk0STIdgdoXtR0dJ8s6KbR2GjnUoV-qgZnF973vhCduo94UDZGlPNhysCxlnZmCCRuLcK49gQLPgXCFxod4bk8JfBOeqTs8GeR7ChIM734O0_4A4esKNyfQTEEYrYltq1v8yD5Alh6-alYoJVeEmpdJveyhC_9vZD8wfSIr0DKCerceTxOZQYmoMLbozYunDIBcodGxKR_EFZ--GwNx3BieSqPYauTJmcBomKAgHKkmcwZmsg_VmCrjoi2SSW0', 
        parent: 'Elena Castillo',
        family: [
            { name: 'Elena Castillo', relationship: 'Madre', phone: '7225551401', photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'Javier Castillo', relationship: 'Padre', phone: '7225551402', photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'Olga Castillo', relationship: 'Tía', phone: '7225551403', photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150', authorized: true }
        ]
    },

    // SECUNDARIA (10)
    { 
        id: 'danna_irina', 
        name: 'DANNA IRINA DURÁN', 
        level: 'SECUNDARIA', 
        grade: '1º SECUNDARIA', 
        group: '1º A', 
        birthday: '2013-03-11',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAt26n3kin1y74Y4yE0a2wZNRwM8iJ3k9HiSRTvU_HAhWFnLvRQ9ucyfFgm-o8BEWIXFGWkWovyg7vigZzYQphdXriMr3-0zyukU9iWb5odtlrfxLMSxQRWbuAedMLZ5e5CQI1DERl8RYpZyUqEm3ASxo-mPxf0pK3fWPFVjameMS7BMjpfLEn1SvYzjF_39vIkGlrlAsjyXi_89_botb8AdYn66ZbCd-97lUclnr3Ms9ovxKj43SmWUGDXABgKhFlMyVJO2ci7cO0', 
        parent: 'María Durán',
        family: [
            { name: 'María Durán', relationship: 'Madre', phone: '7225551501', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'Carlos Durán', relationship: 'Padre', phone: '7225551502', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'Silvia Durán', relationship: 'Tía', phone: '7225551503', photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150', authorized: true }
        ]
    },
    { 
        id: 'emiliano_sanchez', 
        name: 'EMILIANO SÁNCHEZ', 
        level: 'SECUNDARIA', 
        grade: '1º SECUNDARIA', 
        group: '1º B', 
        birthday: '2013-11-22',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDwpuJZDPbBPnxc4UO7C8vqF3WsJqAmpsEnOFKi7mSbQ1hcxxNLTebljSmLxDuh84qZ3GuSQo8m9NWRyShiBGNF-vCxGoF7qPJTDRXOJLKTGLDVHcTsGlbAfsHvewYGSA9iPRj0rdTMrWWJAUGyZDYaRBr1FjYxyCzLaEtu-MRHoQwbgfAwQZzJ5vkj2jjQs3gYGyAhBV92lkIiHL8GPl7uzM_efkcLrTIMnTLdyo-IE7PvK5WNJHAaM1J717rSVUYOZg2X7lIB_e4', 
        parent: 'Javier Sánchez',
        family: [
            { name: 'Javier Sánchez', relationship: 'Padre', phone: '7225551601', photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'Rita Sánchez', relationship: 'Madre', phone: '7225551602', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'Andrés Sánchez', relationship: 'Abuelo', phone: '7225551603', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150', authorized: true }
        ]
    },
    { 
        id: 'valeria_castro', 
        name: 'VALERIA CASTRO', 
        level: 'SECUNDARIA', 
        grade: '1º SECUNDARIA', 
        group: '1º C', 
        birthday: '2013-05-18',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAt26n3kin1y74Y4yE0a2wZNRwM8iJ3k9HiSRTvU_HAhWFnLvRQ9ucyfFgm-o8BEWIXFGWkWovyg7vigZzYQphdXriMr3-0zyukU9iWb5odtlrfxLMSxQRWbuAedMLZ5e5CQI1DERl8RYpZyUqEm3ASxo-mPxf0pK3fWPFVjameMS7BMjpfLEn1SvYzjF_39vIkGlrlAsjyXi_89_botb8AdYn66ZbCd-97lUclnr3Ms9ovxKj43SmWUGDXABgKhFlMyVJO2ci7cO0', 
        parent: 'Adriana Castro',
        family: [
            { name: 'Adriana Castro', relationship: 'Madre', phone: '7225551701', photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'Claudio Castro', relationship: 'Padre', phone: '7225551702', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'Mónica Castro', relationship: 'Tía', phone: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150', authorized: true }
        ]
    },
    { 
        id: 'carlos_ruiz_sec', 
        name: 'CARLOS RUIZ', 
        level: 'SECUNDARIA', 
        grade: '1º SECUNDARIA', 
        group: '1º D', 
        birthday: '2013-09-02',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDamV-AxVX491bDDytyEEK7Iehi_1UjOCwEFwwTlS3vILOq2UerdikC8pZgWAyYpDjcYr6Yhd6pKH7fai8LFpelsKe0DeBsCbU8kjK8R5AffCkv2LhipkpHpohnQiSxwc-2tPftTidux_zw_IWlAIV9QooQ1UYb3OuHWXZV6yonFvup9cOOzHsXdjPyoItv6FWfmHT9G1T8js9yeBTvv2leMX7QNkEtahl4tX3pFB-9GEPfx_Vj_p9RMm9FzGDSCofS4HWo8di_Zdk', 
        parent: 'Ricardo Ruiz',
        family: [
            { name: 'Ricardo Ruiz', relationship: 'Padre', phone: '7225551801', photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'Daniela Ruiz', relationship: 'Madre', phone: '7225551802', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'Sara Ruiz', relationship: 'Hermana', phone: '7225551803', photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150', authorized: true }
        ]
    },
    { 
        id: 'daniel_vargas', 
        name: 'DANIEL VARGAS', 
        level: 'SECUNDARIA', 
        grade: '2º SECUNDARIA', 
        group: '2º A', 
        birthday: '2012-01-14',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA9CoF4geOWXY_-UpBIO-ye4Rxrd4dQ6xK1Zu-SAtrxQqGrwQ6SS0Cq03y0Qfw5Ct2ClO6vK3W6wYBo-kxbzvqvNr3lZk6TFAsbMQhEegnnMKhYHd3X3XfW-EEF51Nw3tLuO_Hqat_IeOVxAhmnFjLY2rpLKzZIzQh5JO1vn_bRSPi-XrXBGHj4VxU8NBO9k9oj2DJToj7pNNreQoZdCEK1_DKHnwhJWyJu2k7Ub4FgefcNYsqEZZEXFnQj9XGk6Oi7tPmQo8n7pEE', 
        parent: 'Roberto Vargas',
        family: [
            { name: 'Roberto Vargas', relationship: 'Padre', phone: '7225551901', photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'Sofía Vargas', relationship: 'Madre', phone: '7225551902', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'Abuelo Luis', relationship: 'Abuelo', phone: '7225551903', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150', authorized: true }
        ]
    },
    { 
        id: 'ana_gomez_sec', 
        name: 'ANA GÓMEZ', 
        level: 'SECUNDARIA', 
        grade: '2º SECUNDARIA', 
        group: '2º B', 
        birthday: '2012-07-28',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAt26n3kin1y74Y4yE0a2wZNRwM8iJ3k9HiSRTvU_HAhWFnLvRQ9ucyfFgm-o8BEWIXFGWkWovyg7vigZzYQphdXriMr3-0zyukU9iWb5odtlrfxLMSxQRWbuAedMLZ5e5CQI1DERl8RYpZyUqEm3ASxo-mPxf0pK3fWPFVjameMS7BMjpfLEn1SvYzjF_39vIkGlrlAsjyXi_89_botb8AdYn66ZbCd-97lUclnr3Ms9ovxKj43SmWUGDXABgKhFlMyVJO2ci7cO0', 
        parent: 'Gabriel Gómez',
        family: [
            { name: 'Gabriel Gómez', relationship: 'Padre', phone: '7225552001', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'Clara de Gómez', relationship: 'Madre', phone: '7225552002', photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'Mateo Gómez', relationship: 'Tío', phone: '7225552003', photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150', authorized: true }
        ]
    },
    { 
        id: 'mariana_lopez', 
        name: 'MARIANA LÓPEZ', 
        level: 'SECUNDARIA', 
        grade: '2º SECUNDARIA', 
        group: '2º C', 
        birthday: '2012-10-09',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDb0AhBhLBFFNOaKEk0STIdgdoXtR0dJ8s6KbR2GjnUoV-qgZnF973vhCduo94UDZGlPNhysCxlnZmCCRuLcK49gQLPgXCFxod4bk8JfBOeqTs8GeR7ChIM734O0_4A4esKNyfQTEEYrYltq1v8yD5Alh6-alYoJVeEmpdJveyhC_9vZD8wfSIr0DKCerceTxOZQYmoMLbozYunDIBcodGxKR_EFZ--GwNx3BieSqPYauTJmcBomKAgHKkmcwZmsg_VmCrjoi2SSW0', 
        parent: 'Carmen López',
        family: [
            { name: 'Carmen López', relationship: 'Madre', phone: '7225552101', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'Pedro López', relationship: 'Padre', phone: '7225552102', photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'Gabriela López', relationship: 'Hermana Mayor', phone: '7225552103', photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150', authorized: false }
        ]
    },
    { 
        id: 'regina_silva', 
        name: 'REGINA SILVA', 
        level: 'SECUNDARIA', 
        grade: '3º SECUNDARIA', 
        group: '3º A', 
        birthday: '2011-04-14',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDwpuJZDPbBPnxc4UO7C8vqF3WsJqAmpsEnOFKi7mSbQ1hcxxNLTebljSmLxDuh84qZ3GuSQo8m9NWRyShiBGNF-vCxGoF7qPJTDRXOJLKTGLDVHcTsGlbAfsHvewYGSA9iPRj0rdTMrWWJAUGyZDYaRBr1FjYxyCzLaEtu-MRHoQwbgfAwQZzJ5vkj2jjQs3gYGyAhBV92lkIiHL8GPl7uzM_efkcLrTIMnTLdyo-IE7PvK5WNJHAaM1J717rSVUYOZg2X7lIB_e4', 
        parent: 'Gabriela Silva',
        family: [
            { name: 'Gabriela Silva', relationship: 'Madre', phone: '7225552201', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'Armando Silva', relationship: 'Padre', phone: '7225552202', photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'Teresa Silva', relationship: 'Abuela', phone: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=150', authorized: true }
        ]
    },
    { 
        id: 'jimena_ortiz', 
        name: 'JIMENA ORTIZ', 
        level: 'SECUNDARIA', 
        grade: '3º SECUNDARIA', 
        group: '3º B', 
        birthday: '2011-12-05',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBSjH25FZv4tA8v_m--vMmYkOqzv9p6io65EZTIEZrxiyNX3BDt2dSWMsMbd2HVhGCo63q2SvOnNAeFQbT2Iuf-b9Ew-EajvSkp2KKpTNBmuodJc29xy0fR5pE6FG520lj_imxRdTMUxymznW7_zJCpVFVpguvETQ88Nu7gah5fEhdJoOQM0eg35ZnzJKijgWfxXOazxyEyma5c-jJJrWfd_S6-1Pb7SvkmbKMWBSXKAuBtQ_6EHG8QhnnoudOjTRBGMV1evoK_WHI', 
        parent: 'Jorge Ortiz',
        family: [
            { name: 'Jorge Ortiz', relationship: 'Padre', phone: '7225552301', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'María de Ortiz', relationship: 'Madre', phone: '7225552302', photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'Pedro Ortiz', relationship: 'Abuelo', phone: '7225552303', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150', authorized: true }
        ]
    },
    { 
        id: 'nicolas_herrera', 
        name: 'NICOLÁS HERRERA', 
        level: 'SECUNDARIA', 
        grade: '3º SECUNDARIA', 
        group: '3º D', 
        birthday: '2011-08-30',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDamV-AxVX491bDDytyEEK7Iehi_1UjOCwEFwwTlS3vILOq2UerdikC8pZgWAyYpDjcYr6Yhd6pKH7fai8LFpelsKe0DeBsCbU8kjK8R5AffCkv2LhipkpHpohnQiSxwc-2tPftTidux_zw_IWlAIV9QooQ1UYb3OuHWXZV6yonFvup9cOOzHsXdjPyoItv6FWfmHT9G1T8js9yeBTvv2leMX7QNkEtahl4tX3pFB-9GEPfx_Vj_p9RMm9FzGDSCofS4HWo8di_Zdk', 
        parent: 'Luis Herrera',
        family: [
            { name: 'Luis Herrera', relationship: 'Padre', phone: '7225552401', photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'Sonia Herrera', relationship: 'Madre', phone: '7225552402', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'Juan Herrera', relationship: 'Tío', phone: '7225552403', photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150', authorized: true }
        ]
    }
];

// Funciones para persistencia
function getStoredStudents() {
    let list = localStorage.getItem('stitch_students');
    if (!list) {
        localStorage.setItem('stitch_students', JSON.stringify(DEFAULT_STUDENTS));
        return DEFAULT_STUDENTS;
    }
    try {
        return JSON.parse(list);
    } catch (e) {
        return DEFAULT_STUDENTS;
    }
}

function saveStoredStudents(students) {
    localStorage.setItem('stitch_students', JSON.stringify(students));
}

function getStoredGroups() {
    let groups = localStorage.getItem('stitch_level_groups');
    if (!groups) {
        localStorage.setItem('stitch_level_groups', JSON.stringify(DEFAULT_GROUPS));
        return DEFAULT_GROUPS;
    }
    try {
        return JSON.parse(groups);
    } catch (e) {
        return DEFAULT_GROUPS;
    }
}

function saveStoredGroups(groups) {
    localStorage.setItem('stitch_level_groups', JSON.stringify(groups));
}
