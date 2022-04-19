import cors from 'cors'
import express from 'express'
import mongoose from 'mongoose'
import moment from 'moment'

import { WebhookClient } from 'dialogflow-fulfillment'

const Matutina = mongoose.model('matutina', new mongoose.Schema({}, { collection: 'matutina' }))
const Nocturna = mongoose.model('nocturna', new mongoose.Schema({}, { collection: 'nocturna' }))
const Primera = mongoose.model('primera', new mongoose.Schema({}, { collection: 'primera' }))
const Vespertina = mongoose.model('vespertina', new mongoose.Schema({}, { collection: 'vespertina' }))

const initApp = async () => {
    await mongoose.connect('mongodb://quesalio:quesalio777@51.68.133.225:27017/quesalio', { useNewUrlParser: true, useUnifiedTopology: true })

    const app = express()

    app.use(cors({ origin: '*' }))
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))
    app.use(express.static(__dirname + '/../public'))

    app.post('/webhook', async (req, res) => {
        const WC = new WebhookClient({ request: req, response: res })
        const today = moment().utcOffset('-0300').subtract(1, 'day').startOf('day')
        const query = req.body.queryResult.queryText

        const responseController = (response: any) => {
            const docs: any[] = JSON.parse(JSON.stringify(response))

            const keys = [1, 2, 3, 4, 5, 6]

            const array: any[] = []

            for (const key of keys) {
                for (const doc of docs) {
                    if (key === 1 && doc.id_loteria === '25' && doc.value.length > 0) array.push(`Ciudad ${doc.value}`)
                    if (key === 2 && doc.id_loteria === '24' && doc.value.length > 0) array.push(`Provincia ${doc.value}`)
                    if (key === 3 && doc.id_loteria === '23' && doc.value.length > 0) array.push(`Montevideo ${doc.value}`)
                    if (key === 4 && doc.id_loteria === '38' && doc.value.length > 0) array.push(`Santa Fe ${doc.value}`)
                    if (key === 5 && doc.id_loteria === '28' && doc.value.length > 0) array.push(`Córdoba ${doc.value}`)
                    if (key === 6 && doc.id_loteria === '39' && doc.value.length > 0) array.push(`Entre Ríos ${doc.value}`)
                }
            }

            return array.filter((item) => item !== undefined).join(' ')
        }

        const Webhook = async (agent: any) => {
            const resMA = await Matutina.find({ date: { $gte: today.toDate(), $lt: moment(today).endOf('day').toDate() } }, '-_id id_loteria value', {
                sort: { id_loteria: 'asc' },
            })

            const resNO = await Nocturna.find({ date: { $gte: today.toDate(), $lt: moment(today).endOf('day').toDate() } }, '-_id id_loteria value', {
                sort: { id_loteria: 'asc' },
            })

            const resPR = await Primera.find({ date: { $gte: today.toDate(), $lt: moment(today).endOf('day').toDate() } }, '-_id id_loteria value', {
                sort: { id_loteria: 'asc' },
            })

            const resVE = await Vespertina.find({ date: { $gte: today.toDate(), $lt: moment(today).endOf('day').toDate() } }, '-_id id_loteria value', {
                sort: { id_loteria: 'asc' },
            })

            if (query && query.toLowerCase() === 'que salio hoy')
                agent.add(`
                    Primera
                    ----------
                    ${responseController(resPR)}
                    ----------
                    Matutina
                    ----------
                    ${responseController(resMA)}
                    ----------
                    Vespertina
                    ----------
                    ${responseController(resVE)}
                    ----------
                    Nocturna
                    ----------
                    ${responseController(resNO)}
                `)
            else if (query && query.toLowerCase() === 'matutina')
                agent.add(`
                    Matutina
                    ----------
                    ${responseController(resMA)}
                `)
            else if (query && query.toLowerCase() === 'nocturna')
                agent.add(`
                    Nocturna
                    ----------
                    ${responseController(resNO)}
                `)
            else if (query && query.toLowerCase() === 'primera')
                agent.add(`
                    Primera
                    ----------
                    ${responseController(resPR)}
                `)
            else if (query && query.toLowerCase() === 'vespertina')
                agent.add(`
                    Vespertina
                    ----------
                    ${responseController(resVE)}
                `)
            else agent.add(`Error`)
        }

        const intentMap = new Map()

        intentMap.set('Webhook', Webhook)

        WC.handleRequest(intentMap)
    })

    app.listen(process.env.PORT || 80, async () => {
        console.log(`PORT: ${process.env.PORT || 80}`)
    })
}

initApp()
