const { createApp } = Vue

createApp({
    data() {
        return {
            showForm: false,
            form: {
                categoria_id: '',
                descricao: '',
                valor: '',
                data: new Date().toISOString().split('T')[0],
                tipo: 'receita'
            },
            errors: {},
            categorias: [],
            receitas: []
        }
    },
    methods: {
        formatCurrency(value) {
            return value.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })
        },
        formatDate(date) {
            return new Date(date).toLocaleDateString('pt-BR')
        },
        async loadData() {
            try {
                // Carregar categorias
                const categoriasResponse = await fetch('../api/transacoes.php?action=categorias&tipo=receita')
                const categoriasData = await categoriasResponse.json()
                this.categorias = categoriasData

                // Carregar receitas
                const receitasResponse = await fetch('../api/transacoes.php?tipo=receita')
                const receitasData = await receitasResponse.json()
                this.receitas = receitasData
            } catch (error) {
                console.error('Erro ao carregar dados:', error)
                alert('Erro ao carregar dados. Tente novamente.')
            }
        },
        validarFormulario() {
            this.errors = {}
            let isValid = true
            
            // Validar categoria
            if (!this.form.categoria_id) {
                this.errors.categoria_id = 'Selecione uma categoria'
                isValid = false
            }
            
            // Validar descrição
            if (!this.form.descricao || this.form.descricao.trim().length < 3) {
                this.errors.descricao = 'A descrição deve ter pelo menos 3 caracteres'
                isValid = false
            } else if (this.form.descricao.trim().length > 100) {
                this.errors.descricao = 'A descrição deve ter no máximo 100 caracteres'
                isValid = false
            }
            
            // Validar valor
            if (!this.form.valor) {
                this.errors.valor = 'Digite um valor'
                isValid = false
            } else {
                // Remover formatação e verificar se é número válido
                const valorLimpo = this.form.valor.replace(/\./g, '').replace(',', '.')
                if (isNaN(valorLimpo) || parseFloat(valorLimpo) <= 0) {
                    this.errors.valor = 'Digite um valor válido maior que zero'
                    isValid = false
                }
            }
            
            // Validar data
            if (!this.form.data) {
                this.errors.data = 'Selecione uma data'
                isValid = false
            } else {
                const dataRegex = /^\d{4}-\d{2}-\d{2}$/
                if (!dataRegex.test(this.form.data)) {
                    this.errors.data = 'Data inválida. Use o formato YYYY-MM-DD'
                    isValid = false
                }
            }
            
            return isValid
        },
        async handleSubmit() {
            if (!this.validarFormulario()) {
                return
            }
            
            try {
                const response = await fetch('../api/transacoes.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'create',
                        ...this.form
                    })
                })

                const data = await response.json()

                if (data.success) {
                    this.showForm = false
                    this.form = {
                        categoria_id: '',
                        descricao: '',
                        valor: '',
                        data: new Date().toISOString().split('T')[0],
                        tipo: 'receita'
                    }
                    this.errors = {}
                    this.loadData()
                    alert('Receita cadastrada com sucesso!')
                } else {
                    if (data.errors) {
                        // Exibir erros de validação do servidor
                        this.errors = data.errors
                    } else {
                        alert('Erro ao cadastrar receita: ' + data.message)
                    }
                }
            } catch (error) {
                console.error('Erro ao cadastrar receita:', error)
                alert('Erro ao cadastrar receita. Tente novamente.')
            }
        },
        formatarValorInput(e) {
            let valor = e.target.value
            
            // Remove tudo que não for número
            valor = valor.replace(/\D/g, '')
            
            // Converte para número e divide por 100 para obter o formato com centavos
            if (valor !== '') {
                valor = (parseInt(valor) / 100).toFixed(2)
                
                // Formata para o padrão brasileiro
                valor = valor.replace('.', ',')
                
                // Adiciona pontos para milhares
                if (valor.length > 6) {
                    let parteInteira = valor.split(',')[0]
                    const parteDecimal = valor.split(',')[1]
                    
                    // Formata com pontos a cada 3 dígitos
                    parteInteira = parteInteira.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
                    
                    valor = parteInteira + ',' + parteDecimal
                }
            }
            
            this.form.valor = valor
        },
        async deleteReceita(id) {
            if (!confirm('Tem certeza que deseja excluir esta receita?')) {
                return
            }

            try {
                const response = await fetch('../api/transacoes.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'delete',
                        id: id
                    })
                })

                const data = await response.json()

                if (data.success) {
                    this.loadData()
                    alert('Receita excluída com sucesso!')
                } else {
                    alert('Erro ao excluir receita. Tente novamente.')
                }
            } catch (error) {
                console.error('Erro ao excluir receita:', error)
                alert('Erro ao excluir receita. Tente novamente.')
            }
        },
        async logout() {
            try {
                const response = await fetch('../api/auth.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'logout'
                    })
                })

                const data = await response.json()

                if (data.success) {
                    window.location.href = '../login/login.php'
                } else {
                    alert('Erro ao fazer logout. Tente novamente.')
                }
            } catch (error) {
                console.error('Erro ao fazer logout:', error)
                alert('Erro ao fazer logout. Tente novamente.')
            }
        }
    },
    mounted() {
        this.loadData()
    }
}).mount('#app') 