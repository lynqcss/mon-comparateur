import { describe, expect, it } from 'vitest'
import { describeFields, formatRunDate, splitCalls, summarizeRun } from '@/lib/gmc/syncDisplay'

describe('sync journal display', () => {
    it('formats dates in Paris time', () => {
        expect(formatRunDate('2026-11-21T12:53:00Z')).toBe('21/11 · 13:53') // winter: UTC+1
        expect(formatRunDate('2026-07-14T10:05:00Z')).toBe('14/07 · 12:05') // summer: UTC+2
    })

    it('summarizes a run', () => {
        expect(summarizeRun({ status: 'ok', changes: { added: ['1', '2'] } })).toBe('+2 ajoutés')
        expect(summarizeRun({ status: 'ok', changes: { added: ['1'], deactivated: ['3'], updated: [{ accountId: '4', fields: ['name'] }] } })).toBe(
            '+1 ajouté · −1 désactivé · 1 modifié',
        )
        expect(summarizeRun({ status: 'ok', changes: {} })).toBe('Aucun changement')
        expect(summarizeRun({ status: 'aborted', changes: {} })).toBe('Interrompue, rien modifié')
        expect(summarizeRun({ status: 'error', changes: {} })).toBe('Erreur')
    })

    it('separates listing calls from detail errors', () => {
        const { listings, detailErrors } = splitCalls([
            { serviceAccount: 'sa', call: 'Liste des comptes', httpStatus: 200, count: 2 },
            { serviceAccount: 'sa', call: 'Services du compte 1', httpStatus: 403, error: 'HTTP 403' },
        ])
        expect(listings).toHaveLength(1)
        expect(detailErrors).toHaveLength(1)
    })

    it('names changed fields in French', () => {
        expect(describeFields(['name', 'css_provider_id'])).toBe('nom, CSS')
    })
})
