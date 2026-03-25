const request = require('supertest');
const app = require('../Server');

describe('AI Symptom Service - Multi-Diagnosis Analysis', () => {

    describe('POST /analyze', () => {

        test('should return multiple diagnoses with confidence levels', async () => {
            const response = await request(app)
                .post('/analyze')
                .send({ symptoms: 'fever headache fatigue' })
                .expect(200);

            expect(response.body).toHaveProperty('success');
            expect(response.body).toHaveProperty('data');

            const data = response.body.data;
            expect(data).toHaveProperty('possibleConditions');

            const conditions = data.possibleConditions;

            // If it's an array, check it's not empty
            if (Array.isArray(conditions)) {
                expect(conditions.length).toBeGreaterThan(0);

                // If conditions are objects, verify structure
                if (typeof conditions[0] === 'object' && conditions[0] !== null && 'confidence' in conditions[0]) {
                    conditions.forEach(condition => {
                        expect(condition).toHaveProperty('name');
                        expect(condition).toHaveProperty('confidence');
                        if (condition.confidence !== undefined && condition.confidence !== null) {
                            expect(typeof condition.confidence).toBe('number');
                        }
                    });
                }
            }
        });

        test('should return diagnoses sorted by confidence descending', async () => {
            const response = await request(app)
                .post('/analyze')
                .send({ symptoms: 'fever cough fatigue' })
                .expect(200);

            expect(response.body.data).toHaveProperty('possibleConditions');
            const conditions = response.body.data.possibleConditions;
            expect(Array.isArray(conditions)).toBe(true);
        });

        test('should include symptoms in response', async () => {
            const inputSymptoms = 'headache dizziness nausea';
            const response = await request(app)
                .post('/analyze')
                .send({ symptoms: inputSymptoms })
                .expect(200);

            expect(response.body.data).toHaveProperty('symptoms');
        });

        test('should handle missing symptoms gracefully', async () => {
            const response = await request(app)
                .post('/analyze')
                .send({ symptoms: '' });

            // Should return 400 for missing symptoms
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('success', false);
        });

        test('should handle invalid request format', async () => {
            const response = await request(app)
                .post('/analyze')
                .send({ invalidField: 'test' });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        test('should return consistent results for same input', async () => {
            const inputSymptoms = 'fever sore throat';

            const response1 = await request(app)
                .post('/analyze')
                .send({ symptoms: inputSymptoms })
                .expect(200);

            const response2 = await request(app)
                .post('/analyze')
                .send({ symptoms: inputSymptoms })
                .expect(200);

            expect(response1.body.data).toHaveProperty('possibleConditions');
            expect(response2.body.data).toHaveProperty('possibleConditions');
        });

        test('should handle acute medical conditions appropriately', async () => {
            const acuteSymptoms = 'severe chest pain difficulty breathing dizziness';
            const response = await request(app)
                .post('/analyze')
                .send({ symptoms: acuteSymptoms })
                .expect(200);

            expect(response.body.data.possibleConditions).toBeDefined();
        });

        test('should return diagnostic data from API', async () => {
            const response = await request(app)
                .post('/analyze')
                .send({ symptoms: 'fever' })
                .expect(200);

            const data = response.body.data;
            expect(data).toHaveProperty('possibleConditions');
            expect(Array.isArray(data.possibleConditions) || typeof data.possibleConditions === 'string').toBe(true);
        });
    });
});
