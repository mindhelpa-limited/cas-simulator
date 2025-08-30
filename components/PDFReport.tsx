// components/PDFReport.tsx
"use client";

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

type Score = { stationId: number; title: string; scores: { domain: string; score: number; justification: string; }[]; transcript: string; };

interface PDFReportProps {
    candidateName: string;
    scores: Score[];
}

const PDFReport = ({ candidateName, scores }: PDFReportProps) => {
    const styles = StyleSheet.create({
        page: { padding: 30, fontFamily: 'Helvetica', fontSize: 11, color: '#333' },
        title: { fontSize: 22, textAlign: 'center', marginBottom: 20, fontFamily: 'Helvetica-Bold', color: '#1a2a6c' },
        header: { fontSize: 16, marginBottom: 15, fontFamily: 'Helvetica-Bold' },
        stationBlock: { marginBottom: 20, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 15, pageBreakBefore: 'auto' },
        stationTitle: { fontSize: 14, marginBottom: 8, fontFamily: 'Helvetica-Bold', color: '#00529b' },
        domainTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginTop: 5 },
        scoreText: { fontSize: 10, marginLeft: 10, marginBottom: 2 },
        justificationText: { fontSize: 10, marginLeft: 10, marginBottom: 5, fontStyle: 'italic', color: '#555' },
        summaryBlock: { backgroundColor: '#f0f4f8', padding: 15, borderRadius: 5, marginBottom: 20 },
        summaryHeader: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#1a2a6c', marginBottom: 5},
    });

    const overallScore = scores.length > 0 ? scores.reduce((acc, station) => {
        const stationTotal = station.scores.reduce((sum, s) => sum + s.score, 0);
        const stationMax = station.scores.length * 4;
        return stationMax > 0 ? acc + (stationTotal / stationMax) : acc;
    }, 0) / scores.length * 100 : 0;

    return (
        <Document>
            <Page style={styles.page}>
                <Text style={styles.title}>CASC Exam Performance Report</Text>
                <Text style={styles.header}>Candidate: {candidateName}</Text>
                
                <View style={styles.summaryBlock}>
                    <Text style={styles.summaryHeader}>Overall Performance Summary</Text>
                    <Text>Overall Score: {overallScore.toFixed(1)}%</Text>
                    <Text>This report provides a station-by-station breakdown of your performance.</Text>
                </View>

                {scores.map((station) => (
                    <View key={station.stationId} style={styles.stationBlock} wrap={false}>
                        <Text style={styles.stationTitle}>{station.title}</Text>
                        {station.scores.map((s, index) => (
                            <View key={index}>
                                <Text style={styles.domainTitle}>{s.domain}</Text>
                                <Text style={styles.scoreText}>- Score: {s.score} / 4</Text>
                                <Text style={styles.justificationText}>- Justification: {s.justification}</Text>
                            </View>
                        ))}
                    </View>
                ))}
            </Page>
        </Document>
    );
};

export default PDFReport;