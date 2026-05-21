pragma circom 2.0.0;

// Simple GPA proof circuit without external dependencies
template SimpleGPAProof() {
    // Private inputs
    signal input gpa;
    signal input threshold;
    signal input salt;
    
    // Public outputs
    signal output valid;
    
    // Simple constraint: GPA >= threshold
    component gte = GreaterEqThan(32);
    gte.in[0] <== gpa;
    gte.in[1] <== threshold;
    valid <== gte.out;
    
    // Range check: GPA should be between 0 and 1000 (10.0 * 100)
    component rangeCheck1 = LessEqThan(32);
    rangeCheck1.in[0] <== gpa;
    rangeCheck1.in[1] <== 1000;
    rangeCheck1.out === 1;
    
    component rangeCheck2 = GreaterEqThan(32);
    rangeCheck2.in[0] <== gpa;
    rangeCheck2.in[1] <== 0;
    rangeCheck2.out === 1;
}

// Simple comparators without external dependencies
template GreaterEqThan(n) {
    signal input in[2];
    signal output out;
    
    component lt = LessThan(n);
    lt.in[0] <== in[0];
    lt.in[1] <== in[1];
    out <== 1 - lt.out;
}

template LessThan(n) {
    signal input in[2];
    signal output out;
    
    var n2 = 1 << n;
    var n2m1 = n2 - 1;
    var aux = in[0] - in[1];
    
    component lt = Num2Bits(n+1);
    lt.in <== aux + n2;
    out <== 1 - lt.out[n];
}

template LessEqThan(n) {
    signal input in[2];
    signal output out;
    
    component lt = LessThan(n);
    lt.in[0] <== in[0];
    lt.in[1] <== in[1] + 1;
    out <== lt.out;
}

template Num2Bits(n) {
    signal input in;
    signal output out[n];
    
    var lc1 = 0;
    var e2 = 1;
    
    for (var i = 0; i < n; i++) {
        out[i] <-- (in >> i) & 1;
        out[i] * (out[i] - 1) === 0;
        lc1 += out[i] * e2;
        e2 = e2 + e2;
    }
    
    lc1 === in;
}

component main {public [threshold]} = SimpleGPAProof();
