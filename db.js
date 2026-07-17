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
        parent: 'Sofía de Estrada',
        family: [
            { name: 'Sofía de Estrada', relationship: 'Madre', phone: '7221234567', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150', authorized: true },
            { name: 'Ricardo Estrada', relationship: 'Padre', phone: '7229876543', photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150', authorized: true }
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

// ============================================================
// PARENT USER SYSTEM  (Demo → Spring Boot Ready)
// ------------------------------------------------------------
// En producción, los métodos de AuthService / UserService
// serán reemplazados por llamadas fetch() al BE Spring Boot.
// La firma de cada función se mantiene idéntica para un swap
// trivial. Las contraseñas aquí son texto plano solo en demo;
// en BE se usará BCrypt.
// ============================================================

const DEFAULT_PARENT_USERS = [
    {
        id: 'parent_001',
        nombre: 'Sofía de Estrada',
        email: 'sofia.estrada@demo.com',
        // DEMO ONLY – en producción: BCrypt hash via Spring Security
        password: 'Demo2024',
        studentIds: ['mateo_estrada', 'isabella_torres'],
        active: true,
        tempPassword: false,
        createdAt: '2026-01-10',
        lastLogin: null,
        phone: '7221234567',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150'
    },
    {
        id: 'parent_002',
        nombre: 'Pedro Hernández',
        email: 'pedro.hernandez@demo.com',
        password: 'Demo2024',
        studentIds: ['sofia_hernandez'],
        active: true,
        tempPassword: false,
        createdAt: '2026-01-10',
        lastLogin: null,
        phone: '7225550192',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150'
    },
    {
        id: 'parent_003',
        nombre: 'María Durán',
        email: 'maria.duran@demo.com',
        password: 'Demo2024',
        studentIds: ['danna_irina'],
        active: true,
        tempPassword: false,
        createdAt: '2026-01-10',
        lastLogin: null,
        phone: '7225551501',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'
    },
    {
        id: 'parent_004',
        nombre: 'Carlos Pérez',
        email: 'carlos.perez@demo.com',
        password: 'Demo2024',
        studentIds: ['santiago_perez'],
        active: true,
        tempPassword: false,
        createdAt: '2026-01-10',
        lastLogin: null,
        phone: '7225550291',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150'
    },
    {
        id: 'parent_005',
        nombre: 'Ana Gómez',
        email: 'ana.gomez@demo.com',
        password: 'Demo2024',
        studentIds: ['valentina_gomez'],
        active: true,
        tempPassword: false,
        createdAt: '2026-01-10',
        lastLogin: null,
        phone: '7225550301',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150'
    },
    {
        id: 'parent_006',
        nombre: 'Laura Ruiz',
        email: 'laura.ruiz@demo.com',
        password: 'Demo2024',
        studentIds: ['sebastian_ruiz'],
        active: true,
        tempPassword: false,
        createdAt: '2026-01-10',
        lastLogin: null,
        phone: '7225550411',
        avatar: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=150'
    },
    {
        id: 'parent_007',
        nombre: 'Javier Sánchez',
        email: 'javier.sanchez@demo.com',
        password: 'Demo2024',
        studentIds: ['emiliano_sanchez'],
        active: true,
        tempPassword: false,
        createdAt: '2026-01-10',
        lastLogin: null,
        phone: '7225551601',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150'
    },
    {
        id: 'parent_008',
        nombre: 'Carmen López',
        email: 'carmen.lopez@demo.com',
        password: 'Demo2024',
        studentIds: ['mariana_lopez'],
        active: true,
        tempPassword: false,
        createdAt: '2026-01-10',
        lastLogin: null,
        phone: '7225552101',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150'
    }
];

// -----------------------------------------------
// Persistencia de Usuarios Padres
// -----------------------------------------------
function getStoredParentUsers() {
    let data = localStorage.getItem('stitch_parent_users');
    if (!data) {
        localStorage.setItem('stitch_parent_users', JSON.stringify(DEFAULT_PARENT_USERS));
        return DEFAULT_PARENT_USERS.map(u => ({ ...u }));
    }
    try {
        return JSON.parse(data);
    } catch (e) {
        return DEFAULT_PARENT_USERS.map(u => ({ ...u }));
    }
}

function saveStoredParentUsers(users) {
    localStorage.setItem('stitch_parent_users', JSON.stringify(users));
}

// -----------------------------------------------
// AuthService  –  Simula los endpoints REST:
//   POST /api/auth/login
//   POST /api/auth/logout
//   POST /api/auth/change-password
// -----------------------------------------------
const AuthService = {
    /**
     * Intenta autenticar a un padre con email y password.
     * @returns {{ success: boolean, user?: object, error?: string }}
     * Producción: fetch POST /api/auth/login → { token, user }
     */
    login(email, password) {
        const users = getStoredParentUsers();
        const user = users.find(
            u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );
        if (!user) {
            return { success: false, error: 'Credenciales incorrectas.' };
        }
        if (!user.active) {
            return { success: false, error: 'Tu cuenta está desactivada. Contacta a la escuela.' };
        }
        // Actualizar lastLogin
        user.lastLogin = new Date().toISOString();
        saveStoredParentUsers(users);
        // Guardar sesión
        const session = { userId: user.id, email: user.email, nombre: user.nombre, studentIds: user.studentIds, avatar: user.avatar, tempPassword: user.tempPassword };
        localStorage.setItem('stitch_auth_session', JSON.stringify(session));
        return { success: true, user: session };
    },

    /**
     * Cierra la sesión del padre.
     * Producción: POST /api/auth/logout (invalida JWT)
     */
    logout() {
        localStorage.removeItem('stitch_auth_session');
    },

    /**
     * Retorna la sesión activa o null.
     * Producción: valida JWT del header Authorization
     */
    getCurrentUser() {
        try {
            const raw = localStorage.getItem('stitch_auth_session');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    },

    /**
     * Cambia la contraseña del usuario autenticado.
     * @returns {{ success: boolean, error?: string }}
     * Producción: PUT /api/auth/change-password { oldPassword, newPassword }
     */
    changePassword(userId, oldPassword, newPassword) {
        if (!newPassword || newPassword.length < 6) {
            return { success: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
        }
        const users = getStoredParentUsers();
        const user = users.find(u => u.id === userId);
        if (!user) return { success: false, error: 'Usuario no encontrado.' };
        if (user.password !== oldPassword) return { success: false, error: 'La contraseña actual es incorrecta.' };
        user.password = newPassword;
        user.tempPassword = false;
        saveStoredParentUsers(users);
        // Actualizar sesión
        const session = AuthService.getCurrentUser();
        if (session) {
            session.tempPassword = false;
            localStorage.setItem('stitch_auth_session', JSON.stringify(session));
        }
        return { success: true };
    }
};

// -----------------------------------------------
// UserService  –  Gestión desde el Super Admin.
//   Simula endpoints REST:
//   GET    /api/users/parents
//   POST   /api/users/parents
//   PUT    /api/users/parents/:id
//   DELETE /api/users/parents/:id
//   POST   /api/users/parents/:id/reset-password
// -----------------------------------------------
const UserService = {
    /** Lista todos los usuarios padres */
    getAll() {
        return getStoredParentUsers();
    },

    /** Crea un nuevo usuario padre */
    create({ nombre, email, password, studentIds = [], phone = '', avatar = '' }) {
        const users = getStoredParentUsers();
        // Validar email único
        if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
            return { success: false, error: 'Ya existe un usuario con ese email.' };
        }
        const newUser = {
            id: 'parent_' + Date.now(),
            nombre,
            email,
            password: password || 'Temporal123',
            studentIds,
            active: true,
            tempPassword: true,
            createdAt: new Date().toISOString().slice(0, 10),
            lastLogin: null,
            phone,
            avatar: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'
        };
        users.push(newUser);
        saveStoredParentUsers(users);
        return { success: true, user: newUser };
    },

    /** Actualiza datos de un usuario padre */
    update(userId, { nombre, email, studentIds, phone, avatar, active }) {
        const users = getStoredParentUsers();
        const user = users.find(u => u.id === userId);
        if (!user) return { success: false, error: 'Usuario no encontrado.' };
        // Validar email único al cambiar
        if (email && email.toLowerCase() !== user.email.toLowerCase()) {
            if (users.find(u => u.id !== userId && u.email.toLowerCase() === email.toLowerCase())) {
                return { success: false, error: 'El email ya está en uso.' };
            }
            user.email = email;
        }
        if (nombre !== undefined) user.nombre = nombre;
        if (studentIds !== undefined) user.studentIds = studentIds;
        if (phone !== undefined) user.phone = phone;
        if (avatar !== undefined) user.avatar = avatar;
        if (active !== undefined) user.active = active;
        saveStoredParentUsers(users);
        return { success: true, user };
    },

    /** Elimina un usuario padre */
    delete(userId) {
        let users = getStoredParentUsers();
        const exists = users.find(u => u.id === userId);
        if (!exists) return { success: false, error: 'Usuario no encontrado.' };
        users = users.filter(u => u.id !== userId);
        saveStoredParentUsers(users);
        return { success: true };
    },

    /** Resetea la contraseña a un valor temporal */
    resetPassword(userId, newTempPassword = null) {
        const users = getStoredParentUsers();
        const user = users.find(u => u.id === userId);
        if (!user) return { success: false, error: 'Usuario no encontrado.' };
        const temp = newTempPassword || 'Cambiar' + Math.floor(Math.random() * 9000 + 1000);
        user.password = temp;
        user.tempPassword = true;
        saveStoredParentUsers(users);
        return { success: true, tempPassword: temp };
    },

    /** Activa o desactiva una cuenta */
    toggleActive(userId) {
        const users = getStoredParentUsers();
        const user = users.find(u => u.id === userId);
        if (!user) return { success: false };
        user.active = !user.active;
        saveStoredParentUsers(users);
        return { success: true, active: user.active };
    }
};

// ============================================================
// TEACHER USER SYSTEM  (Demo → Spring Boot Ready)
// ------------------------------------------------------------
// Mirrors the Parent User System. En producción, los métodos
// serán reemplazados por llamadas fetch() al BE Spring Boot.
// ============================================================

const DEFAULT_TEACHER_USERS = [
    {
        id: 'teacher_001',
        nombre: 'Ana Reyes',
        email: 'ana.reyes@demo.com',
        password: 'Demo2024',
        level: 'KINDER',
        groups: ['1º A', '1º B'],
        active: true,
        tempPassword: false,
        createdAt: '2026-01-10',
        lastLogin: null,
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150'
    },
    {
        id: 'teacher_002',
        nombre: 'Carlos Mendoza',
        email: 'carlos.mendoza@demo.com',
        password: 'Demo2024',
        level: 'PRIMARIA',
        groups: ['1º B', '2º C', '3º A'],
        active: true,
        tempPassword: false,
        createdAt: '2026-01-10',
        lastLogin: null,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150'
    },
    {
        id: 'teacher_003',
        nombre: 'Sofía Vargas',
        email: 'sofia.vargas@demo.com',
        password: 'Demo2024',
        level: 'SECUNDARIA',
        groups: ['1º A', '2º A', '3º B'],
        active: true,
        tempPassword: false,
        createdAt: '2026-01-10',
        lastLogin: null,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'
    },
    {
        id: 'teacher_004',
        nombre: 'Jorge López',
        email: 'jorge.lopez@demo.com',
        password: 'Demo2024',
        level: 'PRIMARIA',
        groups: ['4º A', '5º B', '6º A'],
        active: true,
        tempPassword: false,
        createdAt: '2026-01-10',
        lastLogin: null,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150'
    }
];

// -----------------------------------------------
// Persistencia de Usuarios Maestros
// -----------------------------------------------
function getStoredTeacherUsers() {
    let data = localStorage.getItem('stitch_teacher_users');
    if (!data) {
        localStorage.setItem('stitch_teacher_users', JSON.stringify(DEFAULT_TEACHER_USERS));
        return DEFAULT_TEACHER_USERS.map(u => ({ ...u }));
    }
    try {
        return JSON.parse(data);
    } catch (e) {
        return DEFAULT_TEACHER_USERS.map(u => ({ ...u }));
    }
}

function saveStoredTeacherUsers(users) {
    localStorage.setItem('stitch_teacher_users', JSON.stringify(users));
}

// -----------------------------------------------
// TeacherAuthService  –  Simula los endpoints REST:
//   POST /api/auth/teacher/login
//   POST /api/auth/teacher/logout
//   PUT  /api/auth/teacher/change-password
// -----------------------------------------------
const TeacherAuthService = {
    /**
     * Autentica a un maestro con email y password.
     * @returns {{ success: boolean, user?: object, error?: string }}
     */
    login(email, password) {
        const users = getStoredTeacherUsers();
        const user = users.find(
            u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );
        if (!user) return { success: false, error: 'Credenciales incorrectas.' };
        if (!user.active) return { success: false, error: 'Tu cuenta está desactivada. Contacta al administrador.' };
        user.lastLogin = new Date().toISOString();
        saveStoredTeacherUsers(users);
        const session = {
            userId: user.id,
            email: user.email,
            nombre: user.nombre,
            level: user.level,
            groups: user.groups,
            avatar: user.avatar,
            tempPassword: user.tempPassword
        };
        localStorage.setItem('stitch_teacher_session', JSON.stringify(session));
        return { success: true, user: session };
    },

    logout() {
        localStorage.removeItem('stitch_teacher_session');
    },

    getCurrentUser() {
        try {
            const raw = localStorage.getItem('stitch_teacher_session');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    },

    changePassword(userId, oldPassword, newPassword) {
        if (!newPassword || newPassword.length < 6) {
            return { success: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
        }
        const users = getStoredTeacherUsers();
        const user = users.find(u => u.id === userId);
        if (!user) return { success: false, error: 'Usuario no encontrado.' };
        if (user.password !== oldPassword) return { success: false, error: 'La contraseña actual es incorrecta.' };
        user.password = newPassword;
        user.tempPassword = false;
        saveStoredTeacherUsers(users);
        const session = TeacherAuthService.getCurrentUser();
        if (session) {
            session.tempPassword = false;
            localStorage.setItem('stitch_teacher_session', JSON.stringify(session));
        }
        return { success: true };
    }
};

// -----------------------------------------------
// TeacherService  –  Gestión desde el Super Admin.
// -----------------------------------------------
const TeacherService = {
    getAll() {
        return getStoredTeacherUsers();
    },

    create({ nombre, email, password, level = '', groups = [], avatar = '' }) {
        const users = getStoredTeacherUsers();
        if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
            return { success: false, error: 'Ya existe un maestro con ese email.' };
        }
        const newUser = {
            id: 'teacher_' + Date.now(),
            nombre, email,
            password: password || 'Temporal123',
            level, groups,
            active: true,
            tempPassword: true,
            createdAt: new Date().toISOString().slice(0, 10),
            lastLogin: null,
            avatar: avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150'
        };
        users.push(newUser);
        saveStoredTeacherUsers(users);
        return { success: true, user: newUser };
    },

    update(userId, { nombre, email, level, groups, avatar, active }) {
        const users = getStoredTeacherUsers();
        const user = users.find(u => u.id === userId);
        if (!user) return { success: false, error: 'Maestro no encontrado.' };
        if (email && email.toLowerCase() !== user.email.toLowerCase()) {
            if (users.find(u => u.id !== userId && u.email.toLowerCase() === email.toLowerCase())) {
                return { success: false, error: 'El email ya está en uso.' };
            }
            user.email = email;
        }
        if (nombre !== undefined) user.nombre = nombre;
        if (level !== undefined) user.level = level;
        if (groups !== undefined) user.groups = groups;
        if (avatar !== undefined) user.avatar = avatar;
        if (active !== undefined) user.active = active;
        saveStoredTeacherUsers(users);
        return { success: true, user };
    },

    delete(userId) {
        let users = getStoredTeacherUsers();
        if (!users.find(u => u.id === userId)) return { success: false, error: 'Maestro no encontrado.' };
        users = users.filter(u => u.id !== userId);
        saveStoredTeacherUsers(users);
        return { success: true };
    },

    resetPassword(userId, newTempPassword = null) {
        const users = getStoredTeacherUsers();
        const user = users.find(u => u.id === userId);
        if (!user) return { success: false, error: 'Maestro no encontrado.' };
        const temp = newTempPassword || 'Cambiar' + Math.floor(Math.random() * 9000 + 1000);
        user.password = temp;
        user.tempPassword = true;
        saveStoredTeacherUsers(users);
        return { success: true, tempPassword: temp };
    },

    toggleActive(userId) {
        const users = getStoredTeacherUsers();
        const user = users.find(u => u.id === userId);
        if (!user) return { success: false };
        user.active = !user.active;
        saveStoredTeacherUsers(users);
        return { success: true, active: user.active };
    }
};

// -----------------------------------------------
// DeliveryLogService – Auditoría de Entregas
// -----------------------------------------------
const DeliveryLogService = {
    getLogs() {
        try {
            return JSON.parse(localStorage.getItem('stitch_delivery_logs') || '[]');
        } catch(e) {
            return [];
        }
    },
    
    saveLogs(logs) {
        localStorage.setItem('stitch_delivery_logs', JSON.stringify(logs));
    },

    // Cuando el maestro/guardia entrega
    logTeacherConfirm(studentId, studentName, group, teacherName, pickupMethod) {
        const logs = this.getLogs();
        const todayStr = new Date().toISOString().slice(0, 10);
        const timeStr = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
        
        let log = logs.find(l => l.studentId === studentId && l.date === todayStr);
        if (!log) {
            log = {
                id: 'del_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
                date: todayStr,
                studentId,
                studentName,
                group,
                teacherName: teacherName || 'Guardia / Administrador',
                pickupMethod: pickupMethod || 'CAR',
                status: 'ENTREGADO_ESCUELA',
                timeTeacher: timeStr,
                timeParent: null,
                parentConfirmed: false
            };
            logs.unshift(log);
        } else {
            log.timeTeacher = timeStr;
            log.teacherName = teacherName || log.teacherName;
            log.pickupMethod = pickupMethod || log.pickupMethod;
        }
        this.saveLogs(logs);
        return log;
    },

    // Cuando el padre confirma el "SÍ, YA LO RECIBÍ"
    logParentConfirm(studentId) {
        const logs = this.getLogs();
        const todayStr = new Date().toISOString().slice(0, 10);
        const timeStr = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
        
        const log = logs.find(l => l.studentId === studentId && l.date === todayStr);
        if (log) {
            log.parentConfirmed = true;
            log.timeParent = timeStr;
            log.status = 'RECIBIDO_PADRE';
            this.saveLogs(logs);
            return { success: true, log };
        }
        return { success: false, error: 'No se encontró el registro de entrega para hoy.' };
    }
};

