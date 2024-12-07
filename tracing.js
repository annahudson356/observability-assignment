const { Resource } = require("@opentelemetry/resources");
const { SemanticResourceAttributes } = require("@opentelemetry/semantic-conventions");
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');
const { SimpleSpanProcessor } = require("@opentelemetry/sdk-trace-base");
const { NodeTracerProvider } = require("@opentelemetry/sdk-trace-node");
const { trace } = require("@opentelemetry/api");

const { ExpressInstrumentation } = require("opentelemetry-instrumentation-express");
const { MongoDBInstrumentation } = require("@opentelemetry/instrumentation-mongodb");
const { HttpInstrumentation } = require("@opentelemetry/instrumentation-http");
const { registerInstrumentations } = require("@opentelemetry/instrumentation");
// Used the documentation to figure this out
module.exports = (serviceName) => {

  const exporter = new JaegerExporter({
    endpoint: 'http://localhost:14268/api/traces', 
    username: null,
    password: null,
    tags: [],
  });

  const provider = new NodeTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
      'host.name': 'localhost'
    }),
  });

  provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
  provider.register();

  registerInstrumentations({
    instrumentations: [
      new HttpInstrumentation({
        // Enable more detailed HTTP instrumentation
        requestHook: (span, request) => {
          span.setAttribute('http.full_url', request.url);
        }
      }),
      new ExpressInstrumentation(),
      new MongoDBInstrumentation(),
    ],
    tracerProvider: provider,
  });

  return trace.getTracer(serviceName);
};
