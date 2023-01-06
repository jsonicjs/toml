const { Jsonic, Debug } = require('@jsonic/jsonic-next')
const { Toml } = require('..')

const toml = Jsonic.make()
      .use(Debug,{
        trace:true
      })
      .use(Toml,{
      })

console.dir(toml(`
x=2
a.b=1
# "a" = "μ"
q=1
"μ" = "a"
`),{depth:null})


// console.dir(toml(`
// m = '''a'b''c'''
// n = "\\nQ\\eW\\"E"
// e = ''
// a = 'A'
// b = 'Bb'
// aa = "A"
// bb = "Bb"
// q = ''''q''''
// qq = '''''q'''''
// c = '''c'''
// cc = '''
// c
// '''
// dd = '''
//   d\
//   d\
//   f
//   f
// '''
// `),{depth:null})



// console.dir(toml(`
// a = 1987-07-05T17:45:00.000Z
// b = 1988-07-05T17:45:00Z
// c = [1989-07-05T17:45:00Z]
// `),{depth:null})


// console.dir(toml(`
// [[a]]
// [[a.b]]
// [a.b.c]
// d=0

// `),{depth:null})



// a=1
// b=2

// [foo]
// c=3
// d=4

// [zoo]
// cc=33
// dd=44

// [bar.zed]
// e=5
// f=6

// [red.green.blue]
// g=7
// h=8

// [red.green]
// i=9

// [[one]]
// j=10
// k=11

// [[two]]
// l=12
// m=13

// [[two]]
// l=14
// m=15

// [[three.four]]
// o=16
// p=17

// `),{depth:null})


// // console.log(toml(''))

// console.dir(toml(`
// #[x.y.z.w] # for this to work
// #[x] # defining a super-table afterwards is ok

// # a=9

// #[bar]
// #b=0

// [[foo]]
// a = 1
// b = 2

// [[foo]]
// a = 11
// b = 22



// `),{depth:null})

// /*
// #[[foo]]
// #a = 11
// #b = 22

// [[q.w]]
// x=1

// #[[q.w]]
// #x=2

// [bar]
// x = 3

// [bar]
// y = [4]

// #[zed]
// #q = [5]
// #w = 6
// `))
// */

// // console.dir(toml(`
// // o = 0
// // p.r = 9

// // [a]
// // x.q.w = 1

// // [b.c]
// // y = 2

// // [d]
// // z = 3

// // [e.f.g.h]
// // q = 4

// // [i]
// // w = 5

// // [[j]]
// // aa=1
// // bb=2

// // [g]
// // h=6

// // `),{depth:null})
